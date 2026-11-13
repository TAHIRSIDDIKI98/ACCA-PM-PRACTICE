import React from 'react';
import { X, Eraser } from 'lucide-react';

interface ScratchpadModalProps {
  value: string;
  onChange: (next: string) => void;
  onClose: () => void;
}

export function ScratchpadModal({ value, onChange, onClose }: ScratchpadModalProps) {
  return (
    <div className="fixed bottom-5 left-5 z-50 w-96 max-w-[92vw] bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 text-white">
        <span className="text-xs font-semibold tracking-wide">Digital Scratchpad</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange('')}
            title="Clear scratchpad"
            aria-label="Clear scratchpad"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scratchpad"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3 bg-slate-50 space-y-2">
        <p className="text-[11px] text-slate-500">
          Rough notes only — content in the Scratchpad is not marked in the ACCA CBE exam.
        </p>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={9}
          placeholder="Jot quick outlines, limiting factor rankings, or rough figures here..."
          className="w-full p-2.5 text-xs font-mono bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-[#0369A1]"
        />
      </div>
    </div>
  );
}
