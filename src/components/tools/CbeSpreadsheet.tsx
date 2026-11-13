import React, { useMemo, useState } from 'react';
import { SpreadsheetData } from '../../types/pm';
import { RotateCcw } from 'lucide-react';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROW_COUNT = 22;

function colIndex(col: string): number {
  return COLS.indexOf(col.toUpperCase());
}

function expandRange(startRef: string, endRef: string): string[] {
  const m1 = startRef.replace(/\$/g, '').match(/^([A-H])(\d+)$/i);
  const m2 = endRef.replace(/\$/g, '').match(/^([A-H])(\d+)$/i);
  if (!m1 || !m2) return [];
  const c1 = colIndex(m1[1]);
  const r1 = parseInt(m1[2], 10);
  const c2 = colIndex(m2[1]);
  const r2 = parseInt(m2[2], 10);
  if (c1 < 0 || c2 < 0) return [];
  const refs: string[] = [];
  for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
      refs.push(`${COLS[c]}${r}`);
    }
  }
  return refs;
}

export function evaluateCell(
  cellId: string,
  data: SpreadsheetData,
  visited = new Set<string>()
): string | number {
  const raw = data[cellId];
  if (raw === undefined || raw === '') return '';
  if (!raw.startsWith('=')) {
    const cleaned = raw.replace(/[$,\s]/g, '');
    if (cleaned !== '' && !Number.isNaN(Number(cleaned)) && /^[\d.\-+]+$/.test(cleaned)) {
      return Number(cleaned);
    }
    return raw;
  }

  if (visited.has(cellId)) return '#CYCLE!';
  const nextVisited = new Set(visited);
  nextVisited.add(cellId);

  let expr = raw.slice(1).trim();

  const getNum = (ref: string): number => {
    const val = evaluateCell(ref.replace(/\$/g, '').toUpperCase(), data, nextVisited);
    if (typeof val === 'number') return val;
    const n = Number(String(val).replace(/[$,\s]/g, ''));
    return Number.isNaN(n) ? 0 : n;
  };

  try {
    // Handle SUM, AVERAGE, MIN, MAX, COUNT ranges
    expr = expr.replace(
      /\b(SUM|AVERAGE|AVG|MIN|MAX|COUNT)\(([^()]+)\)/gi,
      (_, fn: string, args: string) => {
        const parts = args.split(',').map(s => s.trim());
        const nums: number[] = [];
        for (const p of parts) {
          if (p.includes(':')) {
            const [sRef, eRef] = p.split(':').map(x => x.trim());
            for (const r of expandRange(sRef, eRef)) {
              const v = evaluateCell(r, data, nextVisited);
              if (typeof v === 'number') nums.push(v);
            }
          } else if (/^\$?[A-H]\$?\d+$/i.test(p)) {
            const v = evaluateCell(p.replace(/\$/g, '').toUpperCase(), data, nextVisited);
            if (typeof v === 'number') nums.push(v);
          } else if (!Number.isNaN(Number(p))) {
            nums.push(Number(p));
          }
        }
        const upper = fn.toUpperCase();
        if (upper === 'SUM') return String(nums.reduce((a, b) => a + b, 0));
        if (upper === 'AVERAGE' || upper === 'AVG')
          return nums.length ? String(nums.reduce((a, b) => a + b, 0) / nums.length) : '0';
        if (upper === 'MIN') return nums.length ? String(Math.min(...nums)) : '0';
        if (upper === 'MAX') return nums.length ? String(Math.max(...nums)) : '0';
        if (upper === 'COUNT') return String(nums.length);
        return '0';
      }
    );

    // Replace remaining cell references (supporting optional $ absolute markers like $B$2)
    expr = expr.replace(/\$?([A-H])\$?([1-9]|1\d|2[0-2])\b/gi, (_, col, row) =>
      String(getNum(`${col}${row}`))
    );

    // Inner-to-outer pass for functions (supports nested expressions cleanly)
    for (let pass = 0; pass < 4; pass++) {
      const prev = expr;
      expr = expr.replace(
        /\bROUND\(([^(),]+),([^()]+)\)/gi,
        (_, val, digits) => `(Math.round((${val}) * Math.pow(10, ${digits})) / Math.pow(10, ${digits}))`
      );
      expr = expr.replace(
        /\bPOWER\(([^(),]+),([^()]+)\)/gi,
        (_, base, exp) => `Math.pow(${base}, ${exp})`
      );
      expr = expr.replace(/\bSQRT\(([^()]+)\)/gi, (_, inner) => `Math.sqrt(${inner})`);
      expr = expr.replace(/\bABS\(([^()]+)\)/gi, (_, inner) => `Math.abs(${inner})`);
      expr = expr.replace(/\bLN\(([^()]+)\)/gi, (_, inner) => `Math.log(${inner})`);
      expr = expr.replace(/\bLOG\(([^()]+)\)/gi, (_, inner) => `Math.log10(${inner})`);
      expr = expr.replace(
        /\bIF\(([^(),]+),([^(),]+),([^()]+)\)/gi,
        (_, cond: string, tVal: string, fVal: string) => {
          const jsCond = cond.replace(/(?<![<>!])=(?!=)/g, '===');
          return `((${jsCond}) ? (${tVal}) : (${fVal}))`;
        }
      );
      if (expr === prev) break;
    }

    // Convert spreadsheet exponent operator ^ to JS **
    expr = expr.replace(/\^/g, '**');

    // Strip safe quoted string literals before validating characters
    const exprNoStrings = expr.replace(/"[^"]*"|'[^']*'/g, '');
    if (/[^0-9+\-*/().,?:<>=!&|\sMathsqrtabspowlog10round]/.test(exprNoStrings)) {
      return '#ERR';
    }

    const result = Function(`"use strict"; return (${expr});`)();
    if (typeof result === 'number') {
      if (!Number.isFinite(result)) return '#DIV/0!';
      return Math.round(result * 10000) / 10000;
    }
    return String(result);
  } catch {
    return '#ERR';
  }
}

interface CbeSpreadsheetProps {
  data: SpreadsheetData;
  onChange: (next: SpreadsheetData) => void;
  questionHint?: string;
}

export function CbeSpreadsheet({ data, onChange }: CbeSpreadsheetProps) {
  const [activeCell, setActiveCell] = useState<string>('A1');
  const [formatMode, setFormatMode] = useState<'auto' | 'currency' | 'percent'>('auto');
  const [confirmClear, setConfirmClear] = useState(false);

  const computedMap = useMemo(() => {
    const out: Record<string, string | number> = {};
    for (let r = 1; r <= ROW_COUNT; r++) {
      for (const c of COLS) {
        const id = `${c}${r}`;
        if (data[id] !== undefined && data[id] !== '') {
          out[id] = evaluateCell(id, data);
        }
      }
    }
    return out;
  }, [data]);

  const setCell = (id: string, val: string) => {
    const next = { ...data };
    if (val === '') delete next[id];
    else next[id] = val;
    onChange(next);
  };

  const formatDisplay = (val: string | number | undefined): string => {
    if (val === undefined || val === '') return '';
    if (typeof val === 'number') {
      if (formatMode === 'currency') {
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (formatMode === 'percent') {
        return `${(val * 100).toFixed(2)}%`;
      }
      return val.toLocaleString('en-US', { maximumFractionDigits: 4 });
    }
    return val;
  };

  return (
    <div className="flex flex-col border border-slate-200 rounded-lg bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <span className="px-2 py-1 text-xs font-mono font-semibold bg-white border border-slate-200 rounded text-slate-800 w-10 text-center shrink-0">
            {activeCell}
          </span>
          <span className="text-xs font-mono text-slate-400">fx</span>
          <input
            type="text"
            value={data[activeCell] ?? ''}
            onChange={e => setCell(activeCell, e.target.value)}
            placeholder="Enter value or formula (e.g. =SUM(B2:B6), =B2*C2)"
            className="flex-1 px-2.5 py-1 text-xs font-mono bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-[#0369A1]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-white border border-slate-200 rounded p-0.5">
            {(['auto', 'currency', 'percent'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setFormatMode(mode)}
                className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
                  formatMode === mode
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'auto' ? '123' : mode === 'currency' ? '$0.00' : '%'}
              </button>
            ))}
          </div>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-rose-700 bg-white border border-slate-200 rounded whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onChange({});
                  setConfirmClear(false);
                }}
                className="px-2 py-1 text-xs font-medium bg-rose-700 text-white rounded whitespace-nowrap shrink-0 cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded whitespace-nowrap shrink-0 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-auto max-h-[420px]">
        <table className="border-collapse text-xs font-mono tabular-nums w-full min-w-[680px]">
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr>
              <th className="w-10 px-2 py-1.5 border-b border-r border-slate-200 text-center text-slate-500 font-medium">
                #
              </th>
              {COLS.map(col => (
                <th
                  key={col}
                  className="min-w-[84px] px-2 py-1.5 border-b border-r border-slate-200 text-center text-slate-600 font-semibold"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROW_COUNT }, (_, idx) => idx + 1).map(row => (
              <tr key={row} className="h-8">
                <td className="bg-slate-50 border-b border-r border-slate-200 text-center text-slate-500 font-medium select-none">
                  {row}
                </td>
                {COLS.map(col => {
                  const id = `${col}${row}`;
                  const isActive = activeCell === id;
                  const raw = data[id] ?? '';
                  const evaluated = computedMap[id];
                  const isFormula = raw.startsWith('=');
                  const displayVal = isActive ? raw : formatDisplay(evaluated);
                  const isNum = typeof evaluated === 'number';

                  return (
                    <td
                      key={id}
                      onClick={() => setActiveCell(id)}
                      className={`border-b border-r border-slate-200 p-0 relative ${
                        isActive ? 'ring-2 ring-inset ring-[#0369A1] bg-sky-50/30' : 'bg-white'
                      }`}
                    >
                      <input
                        type="text"
                        value={displayVal}
                        onFocus={() => setActiveCell(id)}
                        onChange={e => setCell(id, e.target.value)}
                        aria-label={`Cell ${id}`}
                        className={`w-full h-8 px-2 bg-transparent text-xs focus:outline-none ${
                          isNum && !isActive ? 'text-right text-slate-900 font-medium' : 'text-left text-slate-800'
                        } ${isFormula && !isActive ? 'text-[#0369A1]' : ''}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>Supported formulas: =SUM(A1:A5), =AVERAGE(...), =MIN/MAX, =ROUND(A1,2), =LN(A1), =IF(A1&gt;0,1,0), +, -, *, /, ^</span>
        <span>Show formula links clearly to retain method marks</span>
      </div>
    </div>
  );
}
