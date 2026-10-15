import { parseDocument } from 'htmlparser2';
import katex from 'katex';
import 'katex/contrib/mhchem';

export type ContentNode =
  | { kind: 'text'; text: string }
  | { kind: 'element'; tag: string; children: ContentNode[]; start?: number; columnSpan?: number; rowSpan?: number }
  | { kind: 'math'; mathml: string; display: boolean; source: string }
  | { kind: 'error'; source: string; message: string };

const tags = new Set('p div span b strong i em u s sub sup br ul ol li table thead tbody tfoot tr td th blockquote code pre'.split(' '));
const blocked = new Set('script style iframe object embed svg form input button link meta annotation annotation-xml'.split(' '));
const mathTags = new Set('math semantics mrow mstyle mi mn mo mtext ms mfrac msqrt mroot msub msup msubsup munder mover munderover mtable mtr mtd mfenced mspace mpadded mphantom menclose'.split(' '));
const mathAttrs = new Set('display mathvariant stretchy fence separator accent accentunder linethickness open close separators notation width columnalign rowalign'.split(' '));
export const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const serializeMath = (node: any): string => {
  if (node.type === 'text') return escapeXml(node.data);
  if (node.name === 'annotation') return '';
  if (!mathTags.has(node.name)) throw new Error('MathML chưa được hỗ trợ.');
  const attrs = Object.entries(node.attribs || {}).filter(([k]) => mathAttrs.has(k))
    .map(([k, v]) => ` ${k}="${escapeXml(String(v))}"`).join('');
  return `<${node.name}${node.name === 'math' ? ' xmlns="http://www.w3.org/1998/Math/MathML"' : ''}${attrs}>${(node.children || []).map(serializeMath).join('')}</${node.name}>`;
};

const mathNode = (source: string, display: boolean): ContentNode => {
  try {
    // Each expression has independent macros and bounded expansion. Never trust AI HTML/URLs.
    const rendered = katex.renderToString(source, { output: 'mathml', displayMode: display,
      throwOnError: true, trust: false, strict: 'ignore', maxExpand: 1000, maxSize: 20 });
    const root = parseDocument(rendered).children.find((n: any) => n.name === 'span') as any;
    const math = root?.children?.find((n: any) => n.name === 'math');
    if (!math) throw new Error('Missing MathML');
    return { kind: 'math', mathml: serializeMath(math), display, source };
  } catch {
    return { kind: 'error', source, message: 'Công thức không hợp lệ hoặc chưa được hỗ trợ. Hãy sửa trước khi xuất Word.' };
  }
};

// Tokenize math before HTML parsing so comparisons such as $p<q$ are never read as tags.
export const parseQuestionContent = (source: string): ContentNode[] => {
  const math: ContentNode[] = [];
  const input = String(source ?? '').replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<!\\)\$(?!\$)([^$]+?)(?<!\\)\$/g,
    (_match, blockDollar, blockBracket, inlineBracket, inlineDollar) => {
      math.push(mathNode(blockDollar ?? blockBracket ?? inlineBracket ?? inlineDollar, blockDollar != null || blockBracket != null));
      return `<biogen-math data-index="${math.length - 1}"></biogen-math>`;
    });
  const convert = (node: any): ContentNode[] => {
    if (node.type === 'text') return [{ kind: 'text', text: node.data.replace(/\\\$/g, '$') }];
    if (blocked.has(node.name)) return [];
    if (node.name === 'biogen-math') {
      const index = Number(node.attribs?.['data-index']);
      return Number.isInteger(index) && math[index] ? [math[index]] : [];
    }
    if (node.name === 'math') {
      try { return [{ kind: 'math', mathml: serializeMath(node), display: node.attribs?.display === 'block', source: '' }]; }
      catch { return [{ kind: 'error', source: '', message: 'MathML chưa được hỗ trợ. Hãy sửa công thức trước khi xuất Word.' }]; }
    }
    if (node.name === 'img') return [{ kind: 'error', source: node.attribs?.alt || 'Ảnh', message: 'Ảnh trong nội dung HTML chưa được hỗ trợ khi xuất Word.' }];
    if (node.name === 'span' && node.attribs?.['data-value'] && /\bql-formula\b/.test(node.attribs?.class || '')) {
      return [mathNode(node.attribs['data-value'], false)];
    }
    let children: ContentNode[] = (node.children || []).flatMap(convert);
    if (!tags.has(node.name)) return children;
    // Preserve text styling from editors without forwarding arbitrary style, class or event attributes.
    const style = String(node.attribs?.style || '').toLowerCase();
    for (const [test, tag] of [[/font-weight\s*:\s*(bold|[6-9]00)/, 'strong'], [/font-style\s*:\s*italic/, 'em'], [/text-decoration(?:-line)?\s*:[^;]*underline/, 'u'], [/vertical-align\s*:\s*super/, 'sup'], [/vertical-align\s*:\s*sub/, 'sub']] as const) {
      if (test.test(style)) children = [{ kind: 'element', tag, children }];
    }
    return [{ kind: 'element', tag: node.name, children,
      ...(node.name === 'ol' && /^\d+$/.test(node.attribs?.start || '') ? { start: Number(node.attribs.start) } : {}),
      ...(/^(td|th)$/.test(node.name) ? { columnSpan: Math.max(1, Math.min(20, Math.floor(Number(node.attribs?.colspan)) || 1)), rowSpan: Math.max(1, Math.min(50, Math.floor(Number(node.attribs?.rowspan)) || 1)) } : {}) }];
  };
  return parseDocument(input, { decodeEntities: true }).children.flatMap(convert);
};

export const contentErrors = (nodes: ContentNode[]): string[] => nodes.flatMap(n => n.kind === 'error'
  ? [n.message] : n.kind === 'element' ? contentErrors(n.children) : []);

export const contentPlainText = (source: string): string => {
  const text = (nodes: ContentNode[]): string => nodes.map(n => n.kind === 'text' ? n.text
    : n.kind === 'math' ? n.source || parseDocument(n.mathml).children.map(function visit(node: any): string {
      return node.type === 'text' ? node.data : (node.children || []).map(visit).join('');
    }).join('') : n.kind === 'error' ? n.source : n.tag === 'br' ? '\n' : text(n.children) + (/^(p|div|li|tr)$/.test(n.tag) ? '\n' : '')).join('');
  return text(parseQuestionContent(source)).trim();
};

export const hasStructuredContent = (source: string) => parseQuestionContent(source).some(n => n.kind !== 'text');

export const stripQuestionOptionLabel = (value: string, letter: string): string =>
  value.replace(new RegExp(`^(\\s*(?:<(?:p|div|span|b|strong|i|em)\\b[^>]*>\\s*)*)${letter}[.)]\\s*`, 'i'), '$1').trim();
