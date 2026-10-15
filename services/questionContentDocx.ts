import { parseDocument } from 'htmlparser2';
import { AlignmentType, BorderStyle, ImportedXmlComponent, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
  type IParagraphOptions, type IRunOptions, type ParagraphChild } from 'docx';
import { contentErrors, escapeXml, parseQuestionContent, type ContentNode } from './questionContent';

const MATH_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';
const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const elements = (n: any): any[] => (n.children || []).filter((c: any) => c.type === 'tag');
const nodeText = (n: any): string => n.type === 'text' ? n.data : (n.children || []).map(nodeText).join('');
const mr = (text: string, plain = false, variant = '') => {
  const script = /double-struck|fraktur|script|sans-serif|monospace/.exec(variant)?.[0];
  const style = variant.includes('bold') ? (variant.includes('italic') ? 'bi' : 'b') : plain ? 'p' : 'i';
  return `<m:r><m:rPr>${script ? `<m:scr m:val="${script}"/>` : ''}<m:sty m:val="${style}"/></m:rPr><w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math"/></w:rPr><m:t xml:space="preserve">${escapeXml(text)}</m:t></m:r>`;
};

// Convert the shared presentation MathML tree to editable Office Math, without rasterization.
export const mathmlToOmml = (mathml: string): string => {
  const convert = (n: any, plain = false): string => {
    const c = elements(n);
    const seq = () => {
      const parts: string[] = [];
      for (const child of c) {
        const scriptChildren = elements(child);
        const base = scriptChildren[0];
        // mhchem emits post-scripts on a zero-width phantom. Attach them to the
        // preceding atom instead; Word otherwise reserves space for the phantom X.
        if (/^msub(?:sup)?$|^msup$/.test(child.name) && base?.name === 'mpadded'
          && /^0(?:px|em)?$/.test(base.attribs?.width || '') && elements(base).every(x => x.name === 'mphantom')) {
          const atom = parts.pop() || '';
          const script = child.name === 'msub' ? 'sSub' : child.name === 'msup' ? 'sSup' : 'sSubSup';
          parts.push(`<m:${script}><m:e>${atom}</m:e>${child.name !== 'msup' ? `<m:sub>${convert(scriptChildren[1], plain)}</m:sub>` : ''}${child.name !== 'msub' ? `<m:sup>${convert(scriptChildren[child.name === 'msubsup' ? 2 : 1], plain)}</m:sup>` : ''}</m:${script}>`);
        } else parts.push(convert(child, plain || n.attribs?.mathvariant === 'normal'));
      }
      return parts.join('');
    };
    const at = (i: number) => c[i] ? convert(c[i], plain) : '';
    switch (n.name) {
      case 'math': case 'semantics': case 'mstyle': case 'mpadded': return seq();
      case 'mrow': {
        const first = c[0], last = c[c.length - 1];
        if (c.length >= 2 && first?.name === 'mo' && first.attribs?.fence === 'true'
          && last?.name === 'mo' && last.attribs?.fence === 'true') {
          return `<m:d><m:dPr><m:begChr m:val="${escapeXml(nodeText(first))}"/><m:endChr m:val="${escapeXml(nodeText(last))}"/></m:dPr><m:e>${c.slice(1, -1).map(child => convert(child, plain)).join('')}</m:e></m:d>`;
        }
        return seq();
      }
      case 'mi': case 'mn': case 'mo': case 'mtext': case 'ms':
        return mr(nodeText(n), plain || n.name !== 'mi' || n.attribs?.mathvariant === 'normal', n.attribs?.mathvariant);
      case 'mfrac': return `<m:f>${n.attribs?.linethickness === '0px' || n.attribs?.linethickness === '0' ? '<m:fPr><m:type m:val="noBar"/></m:fPr>' : ''}<m:num>${at(0)}</m:num><m:den>${at(1)}</m:den></m:f>`;
      case 'msup': return `<m:sSup><m:e>${at(0)}</m:e><m:sup>${at(1)}</m:sup></m:sSup>`;
      case 'msub': return `<m:sSub><m:e>${at(0)}</m:e><m:sub>${at(1)}</m:sub></m:sSub>`;
      case 'msubsup': return `<m:sSubSup><m:e>${at(0)}</m:e><m:sub>${at(1)}</m:sub><m:sup>${at(2)}</m:sup></m:sSubSup>`;
      case 'msqrt': return `<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>${seq()}</m:e></m:rad>`;
      case 'mroot': return `<m:rad><m:deg>${at(1)}</m:deg><m:e>${at(0)}</m:e></m:rad>`;
      case 'mover': {
        const accent = nodeText(c[1] || { children: [] });
        if (n.attribs?.accent === 'true') {
          if (accent === '¯' || accent === '‾' || accent === '―') return `<m:bar><m:barPr><m:pos m:val="top"/></m:barPr><m:e>${at(0)}</m:e></m:bar>`;
          return `<m:acc><m:accPr><m:chr m:val="${escapeXml(accent)}"/></m:accPr><m:e>${at(0)}</m:e></m:acc>`;
        }
        return `<m:limUpp><m:e>${at(0)}</m:e><m:lim>${at(1)}</m:lim></m:limUpp>`;
      }
      case 'munder': return n.attribs?.accentunder === 'true'
        ? `<m:bar><m:barPr><m:pos m:val="bot"/></m:barPr><m:e>${at(0)}</m:e></m:bar>`
        : `<m:limLow><m:e>${at(0)}</m:e><m:lim>${at(1)}</m:lim></m:limLow>`;
      case 'munderover': return `<m:limUpp><m:e><m:limLow><m:e>${at(0)}</m:e><m:lim>${at(1)}</m:lim></m:limLow></m:e><m:lim>${at(2)}</m:lim></m:limUpp>`;
      case 'mtable': return `<m:m>${c.map(row => `<m:mr>${elements(row).map(cell => `<m:e>${elements(cell).map(child => convert(child, plain)).join('')}</m:e>`).join('')}</m:mr>`).join('')}</m:m>`;
      case 'mtr': case 'mtd': return seq();
      case 'mfenced': return `<m:d><m:dPr><m:begChr m:val="${escapeXml(n.attribs?.open ?? '(')}"/><m:endChr m:val="${escapeXml(n.attribs?.close ?? ')')}"/></m:dPr>${c.map(child => `<m:e>${convert(child, plain)}</m:e>`).join('')}</m:d>`;
      case 'mspace': return mr('\u2009', true);
      case 'mphantom': return `<m:phant><m:phantPr><m:show m:val="0"/></m:phantPr><m:e>${seq()}</m:e></m:phant>`;
      case 'menclose':
        if (n.attribs?.notation === 'box') return `<m:borderBox><m:e>${seq()}</m:e></m:borderBox>`;
        throw new Error('Kiểu khung công thức chưa hỗ trợ trong Word.');
      default: throw new Error(`MathML ${n.name || 'unknown'} chưa được hỗ trợ trong Word.`);
    }
  };
  const math = parseDocument(mathml).children.find((n: any) => n.name === 'math');
  if (!math) throw new Error('Công thức MathML không hợp lệ.');
  return `<m:oMath xmlns:m="${MATH_NS}" xmlns:w="${WORD_NS}">${convert(math)}</m:oMath>`;
};

const equation = (mathml: string): ParagraphChild => {
  // docx 8 wraps parsed XML in a document container. Insert its sole oMath child.
  const parsed = ImportedXmlComponent.fromXmlString(mathmlToOmml(mathml));
  return (parsed as unknown as { root: ParagraphChild[] }).root[0];
};

type RunStyle = Omit<IRunOptions, 'text' | 'children' | 'break'>;
const applyStyle = (tag: string, style: RunStyle): RunStyle => ({ ...style,
  ...(/^(b|strong|th)$/.test(tag) ? { bold: true } : {}),
  ...(/^(i|em)$/.test(tag) ? { italics: true } : {}),
  ...(tag === 'u' ? { underline: {} } : {}), ...(tag === 's' ? { strike: true } : {}),
  ...(tag === 'sup' ? { superScript: true, subScript: false } : {}),
  ...(tag === 'sub' ? { subScript: true, superScript: false } : {}),
});
const inline = (nodes: ContentNode[], style: RunStyle): ParagraphChild[] => nodes.flatMap(n => {
  if (n.kind === 'error') throw new Error(n.message);
  if (n.kind === 'math') return [equation(n.mathml)];
  if (n.kind === 'text') return n.text.split(/\r?\n/).flatMap((text, i) => [
    ...(i ? [new TextRun({ ...style, break: 1 })] : []), new TextRun({ ...style, text }),
  ]);
  if (n.tag === 'br') return [new TextRun({ ...style, break: 1 })];
  const children = inline(n.children, applyStyle(n.tag, style));
  return [...children, ...(/^(p|div|li|tr)$/.test(n.tag) ? [new TextRun({ ...style, break: 1 })] : [])];
});

export const richTextRuns = (value: string, style: RunStyle = {}): ParagraphChild[] =>
  inline(parseQuestionContent(value), { font: 'Times New Roman', size: 24, ...style });

export const richTextBlocks = (value: string, options: IParagraphOptions = {}, prefix: ParagraphChild[] = [], style: RunStyle = {}): Array<Paragraph | Table> => {
  const nodes = parseQuestionContent(value);
  const errors = contentErrors(nodes);
  if (errors.length) throw new Error(errors[0]);
  const blocks: Array<Paragraph | Table> = [];
  let pending: ParagraphChild[] = [...prefix];
  const flush = () => { if (pending.length) { blocks.push(new Paragraph({ ...options, children: pending })); pending = []; } };
  const walk = (items: ContentNode[], currentStyle: RunStyle, depth = 0) => {
    for (const n of items) {
      if (n.kind === 'element' && n.tag === 'table') {
        flush();
        const rows: ContentNode[] = [];
        const collect = (ns: ContentNode[]) => ns.forEach(x => {
          if (x.kind === 'element' && x.tag === 'tr') rows.push(x);
          else if (x.kind === 'element' && /^(thead|tbody|tfoot)$/.test(x.tag)) collect(x.children);
        });
        collect(n.children);
        const border = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
        blocks.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
          rows: rows.map(row => new TableRow({ children: row.kind === 'element' ? row.children.filter(x => x.kind === 'element' && /^(td|th)$/.test(x.tag)).map(cell => {
            if (cell.kind !== 'element') throw new Error('Invalid table cell');
            const cellContent = blocksFromNodes(cell.children, applyStyle(cell.tag, currentStyle));
            return new TableCell({ children: [...cellContent, ...(cellContent.at(-1) instanceof Table ? [new Paragraph('')] : [])], columnSpan: cell.columnSpan, rowSpan: cell.rowSpan,
              margins: { top: 70, bottom: 70, left: 90, right: 90 } });
          }) : [] })) }));
      } else if (n.kind === 'element' && (n.tag === 'ul' || n.tag === 'ol')) {
        flush(); let number = n.start || 1;
        for (const li of n.children) {
          if (li.kind !== 'element' || li.tag !== 'li') continue;
          pending.push(new TextRun({ ...currentStyle, text: `${'  '.repeat(depth)}${n.tag === 'ol' ? `${number++}.` : '•'} ` }));
          walk(li.children, currentStyle, depth + 1); flush();
        }
      } else if (n.kind === 'element' && /^(p|div|pre|blockquote)$/.test(n.tag)) {
        if (blocks.length || pending.length > prefix.length) flush();
        walk(n.children, applyStyle(n.tag, currentStyle), depth); flush();
      } else if (n.kind === 'math' && n.display) {
        flush(); blocks.push(new Paragraph({ ...options, alignment: AlignmentType.CENTER, children: [equation(n.mathml)] }));
      } else pending.push(...inline([n], currentStyle));
    }
  };
  const blocksFromNodes = (ns: ContentNode[], s: RunStyle) => {
    // Cells use the same inline representation, preserving equations and line breaks.
    return [new Paragraph({ spacing: { after: 40 }, children: inline(ns, s) })];
  };
  walk(nodes, { font: 'Times New Roman', size: 24, ...style }); flush();
  return blocks.length ? blocks : [new Paragraph({ ...options, children: prefix })];
};
