import React, { useState } from 'react';
import { X } from 'lucide-react';

export function ScientificCalculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState<string>('0');
  const [memory, setMemory] = useState<number>(0);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [storedVal, setStoredVal] = useState<number | null>(null);
  const [resetNext, setResetNext] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);

  const currentVal = parseFloat(display) || 0;

  const appendDigit = (d: string) => {
    if (resetNext || display === '0') {
      setDisplay(d === '.' ? '0.' : d);
      setResetNext(false);
    } else {
      if (d === '.' && display.includes('.')) return;
      setDisplay(display + d);
    }
  };

  const applyUnary = (fn: 'sqrt' | 'ln' | 'log' | 'neg' | 'pct' | 'sq') => {
    let res = currentVal;
    let label = '';
    if (fn === 'sqrt') {
      res = Math.sqrt(currentVal);
      label = `√(${currentVal})`;
    } else if (fn === 'ln') {
      res = Math.log(currentVal);
      label = `ln(${currentVal})`;
    } else if (fn === 'log') {
      res = Math.log10(currentVal);
      label = `log(${currentVal})`;
    } else if (fn === 'neg') {
      res = -currentVal;
    } else if (fn === 'pct') {
      res = currentVal / 100;
    } else if (fn === 'sq') {
      res = currentVal * currentVal;
      label = `${currentVal}²`;
    }
    const formatted = Number.isFinite(res) ? String(Math.round(res * 1e8) / 1e8) : 'Error';
    setDisplay(formatted);
    if (label) setHistory(h => [`${label} = ${formatted}`, ...h].slice(0, 5));
    setResetNext(true);
  };

  const chooseOp = (op: string) => {
    if (pendingOp && storedVal !== null && !resetNext) {
      const result = computeBinary(storedVal, currentVal, pendingOp);
      setStoredVal(result);
      setDisplay(String(result));
    } else {
      setStoredVal(currentVal);
    }
    setPendingOp(op);
    setResetNext(true);
  };

  const computeBinary = (a: number, b: number, op: string): number => {
    let res = b;
    if (op === '+') res = a + b;
    else if (op === '-') res = a - b;
    else if (op === '*') res = a * b;
    else if (op === '/') res = b === 0 ? NaN : a / b;
    else if (op === '^') res = Math.pow(a, b);
    return Number.isFinite(res) ? Math.round(res * 1e8) / 1e8 : NaN;
  };

  const equals = () => {
    if (pendingOp && storedVal !== null) {
      const res = computeBinary(storedVal, currentVal, pendingOp);
      const out = Number.isNaN(res) ? 'Error' : String(res);
      setHistory(h => [`${storedVal} ${pendingOp} ${currentVal} = ${out}`, ...h].slice(0, 5));
      setDisplay(out);
      setStoredVal(null);
      setPendingOp(null);
      setResetNext(true);
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setStoredVal(null);
    setPendingOp(null);
    setResetNext(false);
  };

  const btnCls =
    'py-2 px-2 text-xs font-mono font-medium rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-900 cursor-pointer tabular-nums';
  const opCls =
    'py-2 px-2 text-xs font-mono font-semibold rounded border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-900 cursor-pointer';

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 text-white">
        <span className="text-xs font-semibold tracking-wide">CBE Scientific Calculator</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close calculator"
          className="p-1 rounded hover:bg-slate-800 text-slate-300 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-2.5 bg-slate-50">
        {history.length > 0 && (
          <div className="text-[11px] font-mono tabular-nums text-slate-500 text-right space-y-0.5 max-h-14 overflow-hidden">
            {history.slice(0, 2).map((item, i) => (
              <div key={i} className="truncate">{item}</div>
            ))}
          </div>
        )}

        <div className="px-3 py-2.5 bg-white border border-slate-200 rounded text-right">
          <div className="text-[11px] font-mono text-slate-400 h-4">
            {pendingOp && storedVal !== null ? `${storedVal} ${pendingOp}` : memory !== 0 ? `M = ${memory}` : ''}
          </div>
          <div className="text-xl font-mono font-semibold tabular-nums text-slate-900 truncate">
            {display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <button type="button" onClick={() => setMemory(0)} className={opCls}>MC</button>
          <button type="button" onClick={() => { setDisplay(String(memory)); setResetNext(true); }} className={opCls}>MR</button>
          <button type="button" onClick={() => setMemory(m => m + currentVal)} className={opCls}>M+</button>
          <button type="button" onClick={clearAll} className="py-2 px-2 text-xs font-semibold rounded bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 cursor-pointer">AC</button>

          <button type="button" onClick={() => applyUnary('ln')} className={opCls}>ln</button>
          <button type="button" onClick={() => applyUnary('log')} className={opCls}>log</button>
          <button type="button" onClick={() => chooseOp('^')} className={opCls}>xʸ</button>
          <button type="button" onClick={() => applyUnary('sqrt')} className={opCls}>√</button>

          <button type="button" onClick={() => appendDigit('7')} className={btnCls}>7</button>
          <button type="button" onClick={() => appendDigit('8')} className={btnCls}>8</button>
          <button type="button" onClick={() => appendDigit('9')} className={btnCls}>9</button>
          <button type="button" onClick={() => chooseOp('/')} className={opCls}>÷</button>

          <button type="button" onClick={() => appendDigit('4')} className={btnCls}>4</button>
          <button type="button" onClick={() => appendDigit('5')} className={btnCls}>5</button>
          <button type="button" onClick={() => appendDigit('6')} className={btnCls}>6</button>
          <button type="button" onClick={() => chooseOp('*')} className={opCls}>×</button>

          <button type="button" onClick={() => appendDigit('1')} className={btnCls}>1</button>
          <button type="button" onClick={() => appendDigit('2')} className={btnCls}>2</button>
          <button type="button" onClick={() => appendDigit('3')} className={btnCls}>3</button>
          <button type="button" onClick={() => chooseOp('-')} className={opCls}>−</button>

          <button type="button" onClick={() => appendDigit('0')} className={btnCls}>0</button>
          <button type="button" onClick={() => appendDigit('.')} className={btnCls}>.</button>
          <button type="button" onClick={() => applyUnary('pct')} className={opCls}>%</button>
          <button type="button" onClick={() => chooseOp('+')} className={opCls}>+</button>

          <button type="button" onClick={() => applyUnary('neg')} className={opCls}>+/−</button>
          <button type="button" onClick={() => applyUnary('sq')} className={opCls}>x²</button>
          <button
            type="button"
            onClick={equals}
            className="col-span-2 py-2 px-2 text-xs font-mono font-semibold rounded bg-[#B91C1C] text-white hover:bg-[#991B1B] cursor-pointer"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}
