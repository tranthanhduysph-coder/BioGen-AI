import React from 'react';
import type { ExamBlueprint, ExamPartKey } from '../../types/examBlueprint';
import { getBlueprintProgress } from '../../services/examBlueprintProgress';

export const BlueprintProgress: React.FC<{
  blueprint: ExamBlueprint; isEnglish: boolean; onInspect: (part: ExamPartKey) => void; disabled?: boolean;
}> = ({ blueprint, isEnglish, onInspect, disabled }) => {
  const { parts } = getBlueprintProgress(blueprint);
  const labels = isEnglish ? ['I · Multiple choice', 'II · True/False', 'III · Short answer'] : ['I · Trắc nghiệm', 'II · Đúng/Sai', 'III · Trả lời ngắn'];
  return <div className="blueprint-progress" aria-label={isEnglish ? 'Allocation progress' : 'Tiến độ phân bổ'}>
    {parts.map((item, index) => {
      const unit = item.part === 'tf' ? (isEnglish ? 'statements' : 'ý') : (isEnglish ? 'questions' : 'câu');
      const text = item.state === 'missing' ? `${isEnglish ? 'Missing' : 'Thiếu'} ${-item.difference} ${unit}`
        : item.state === 'excess' ? `${isEnglish ? 'Excess' : 'Vượt'} ${item.difference} ${unit}`
        : item.state === 'grouping' ? (isEnglish ? 'Fix groups of 4' : 'Chưa đúng nhóm 4 ý')
        : (isEnglish ? 'Count complete' : 'Đã đủ số lượng');
      return <button type="button" key={item.part} disabled={disabled} data-state={item.state} className="blueprint-progress-part"
        onClick={() => onInspect(item.part)} aria-label={`${labels[index]}: ${item.current}/${item.target} ${unit}. ${text}`}>
        <span className="blueprint-progress-label">{labels[index]}</span>
        <span className="blueprint-progress-count">{item.current}<span>/{item.target} {unit}</span></span>
        <span className="blueprint-progress-message">{item.state === 'ready' ? '✓ ' : item.state === 'excess' ? '↑ ' : '! '}{text}</span>
        <span className="blueprint-progress-track" aria-hidden="true"><span style={{width: `${item.target ? Math.min(100, item.current / item.target * 100) : item.current ? 100 : 0}%`}} /></span>
      </button>;
    })}
  </div>;
};
