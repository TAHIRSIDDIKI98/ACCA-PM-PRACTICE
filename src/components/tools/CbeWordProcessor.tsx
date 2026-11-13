import React from 'react';
import { List, Heading2, RotateCcw } from 'lucide-react';

interface CbeWordProcessorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

export function CbeWordProcessor({ value, onChange, placeholder }: CbeWordProcessorProps) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  const insertSnippet = (snippet: string) => {
    const prefix = value && !value.endsWith('\n') ? '\n' : '';
    onChange(`${value}${prefix}${snippet}`);
  };

  return (
    <div className="flex flex-col border border-slate-200 rounded-lg bg-white overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => insertSnippet('## Section Heading\n')}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Heading2 className="w-3.5 h-3.5" />
            <span>Heading</span>
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('• ')}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
            <span>Bullet Point</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tabular-nums text-slate-500">{words} words</span>
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-rose-700 bg-white border border-slate-200 rounded whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={14}
        placeholder={
          placeholder ||
          'Write your narrative analysis here. Use clear sub-headings tied to each requirement part (e.g. (a), (b)) and link points directly to the scenario facts and figures.'
        }
        className="w-full p-4 text-[14px] leading-relaxed text-slate-900 bg-white resize-y focus:outline-none min-h-[280px]"
      />

      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
        Tip: Structure paragraphs using Point + Evidence from Scenario + Financial/Strategic Impact.
      </div>
    </div>
  );
}
