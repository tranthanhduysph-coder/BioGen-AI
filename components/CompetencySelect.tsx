import React, { useEffect, useId, useRef, useState } from 'react';
import { getCompetencyDescription, getCompetencyGroupLabel, resolveCompetencyCode } from '../data/biologySpecification/competencies';

export const CompetencySelect: React.FC<{
  label: string;
  value: string;
  options: string[];
  outcomeCounts?: Record<string, number>;
  onChange: (value: string) => void;
  isEnglish?: boolean;
}> = ({ label, value, options, outcomeCounts, onChange, isEnglish = false }) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const selectedIndex = Math.max(0, options.indexOf(value));
  useEffect(() => { if (open) optionRefs.current[active]?.scrollIntoView({ block: 'nearest' }); }, [active, open]);
  const choose = (index: number) => {
    const selected = options[index];
    if (selected === undefined) return;
    onChange(selected);
    setOpen(false);
  };
  const content = (code: string) => {
    const resolution = resolveCompetencyCode(code);
    return <>
      <span className="block whitespace-pre-line break-words leading-relaxed">{getCompetencyDescription(code, isEnglish)}</span>
      <span className="mt-1 block text-[11px] font-semibold text-sky-700 dark:text-sky-300">
        {getCompetencyGroupLabel(code, isEnglish)}{code && ` · ${code.toUpperCase()}`}
        {outcomeCounts?.[code] !== undefined && ` · ${outcomeCounts[code]} ${isEnglish ? 'outcomes' : 'YCCĐ'}`}
      </span>
      {resolution.status === 'partial' && <span className="mt-1 block text-[11px] text-amber-700 dark:text-amber-300">
        {isEnglish ? 'Source notation needs confirmation' : 'Kí hiệu nguồn cần xác nhận'}: {resolution.unresolvedTokens.join(', ')}
      </span>}
    </>;
  };
  return <div className="w-full" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }} onKeyDown={event => {
    if (!options.length) return;
    if (event.key === 'Escape' || event.key === 'Tab') { setOpen(false); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) { setOpen(true); setActive(selectedIndex); return; }
      if (event.key === 'Home') setActive(0);
      else if (event.key === 'End') setActive(Math.max(0, options.length - 1));
      else setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(active);
      else { setOpen(true); setActive(selectedIndex); }
    }
  }}>
    <button type="button" role="combobox" disabled={!options.length} aria-label={label} aria-expanded={open}
      aria-haspopup="listbox" aria-controls={`${id}-list`}
      aria-activedescendant={open ? `${id}-option-${active}` : undefined}
      onClick={() => { setOpen(current => !current); setActive(selectedIndex); }}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <span className="mb-1 block text-[10px] font-bold text-slate-400">{isEnglish ? 'Change competency' : 'Chọn năng lực'} {open ? '▴' : '▾'}</span>
      {content(value)}
    </button>
    {open && <div id={`${id}-list`} role="listbox" aria-label={label}
      className="mt-1 max-h-[420px] overflow-y-auto rounded-lg border border-sky-300 bg-white p-1 shadow-sm dark:bg-slate-900">
      {options.map((code, index) => <div key={code} id={`${id}-option-${index}`}
        ref={element => { optionRefs.current[index] = element; }} role="option" aria-selected={code === value}
        onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}
        className={`cursor-pointer rounded-md border-b border-slate-100 px-3 py-3 text-xs last:border-0 dark:border-slate-800 ${active === index ? 'bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-100' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'}`}>
        {content(code)}
      </div>)}
    </div>}
  </div>;
};
