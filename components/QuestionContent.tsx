import React, { useMemo } from 'react';
import { parseQuestionContent, type ContentNode } from '../services/questionContent';
import './question-content.css';

export const QuestionContent: React.FC<{ value: string; className?: string }> = ({ value, className = '' }) => {
  const nodes = useMemo(() => parseQuestionContent(value), [value]);
  const render = (items: ContentNode[]): React.ReactNode => items.map((n, i) => {
    if (n.kind === 'text') return <React.Fragment key={i}>{n.text}</React.Fragment>;
    if (n.kind === 'error') return <span key={i} role="alert" className="question-content-error" title={n.message}>{n.source} — {n.message}</span>;
    if (n.kind === 'math') return <span key={i} className={n.display ? 'question-math-block' : 'question-math'}
      // Only MathML rebuilt from the strict tag/attribute allowlist reaches this boundary.
      dangerouslySetInnerHTML={{ __html: n.mathml }} />;
    return React.createElement(n.tag, { key: i, ...(n.tag === 'ol' ? { start: n.start } : {}),
      ...(/^(td|th)$/.test(n.tag) ? { colSpan: n.columnSpan, rowSpan: n.rowSpan } : {}) }, n.tag === 'br' ? undefined : render(n.children));
  });
  return <div className={`question-content ${className}`}>{render(nodes)}</div>;
};
