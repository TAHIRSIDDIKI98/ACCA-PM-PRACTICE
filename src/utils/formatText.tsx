import React from 'react';

/**
 * Renders structured multi-line text containing pipe-delimited tables (`|`)
 * and bullet lists (`•`) as clean academic prose + tabular-nums HTML tables.
 */
export function StructuredContent({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  if (!text) return null;

  const lines = text.split('\n');
  const blocks: Array<
    | { type: 'paragraph'; lines: string[] }
    | { type: 'table'; rows: string[][] }
    | { type: 'bullets'; items: string[] }
  > = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    if (/^[–—-]{3,}$/.test(line.replace(/\|/g, '').trim())) {
      i++;
      continue;
    }

    if (line.includes('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const raw = lines[i].trim();
        if (!/^[–—-\s|]+$/.test(raw)) {
          const cells = raw.split('|').map(c => c.trim());
          tableRows.push(cells);
        }
        i++;
      }
      if (tableRows.length > 0) {
        blocks.push({ type: 'table', rows: tableRows });
      }
      continue;
    }

    if (line.startsWith('•')) {
      const bullets: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('•')) {
        bullets.push(lines[i].trim().slice(1).trim());
        i++;
      }
      blocks.push({ type: 'bullets', items: bullets });
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].includes('|') &&
      !lines[i].trim().startsWith('•')
    ) {
      const cur = lines[i].trim();
      if (/^[–—-]{3,}$/.test(cur)) {
        i++;
        break;
      }
      paraLines.push(cur);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', lines: paraLines });
    }
  }

  return (
    <div className={compact ? 'space-y-2.5 text-[14px] leading-relaxed text-slate-800' : 'space-y-3.5 text-[15px] leading-relaxed text-slate-800'}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'bullets') {
          return (
            <ul key={bIdx} className="list-disc pl-5 space-y-1.5 text-slate-800">
              {block.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'table') {
          const maxCols = Math.max(...block.rows.map(r => r.length));
          const hasLabelFirstCol = block.rows.some(
            (r, idx) =>
              idx > 0 &&
              r.length === maxCols &&
              r[0] !== '' &&
              !/^[\$\£\-\(\)\d,\.%]+$/.test(r[0].replace(/\s+/g, ''))
          );
          const paddedRows = block.rows.map((r, idx) => {
            if (r.length < maxCols && idx <= 1 && hasLabelFirstCol) {
              const pad = Array(maxCols - r.length).fill('');
              return [...pad, ...r];
            }
            return r;
          });
          return (
            <div key={bIdx} className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full border-collapse text-left text-[13px]">
                <tbody>
                  {paddedRows.map((row, rIdx) => {
                    const isFirst = rIdx === 0;
                    return (
                      <tr
                        key={rIdx}
                        className={
                          isFirst
                            ? 'bg-slate-50 font-semibold text-slate-900 border-b border-slate-200'
                            : 'border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70'
                        }
                      >
                        {Array.from({ length: maxCols }).map((_, cIdx) => {
                          const val = row[cIdx] ?? '';
                          const isNumeric = /^[\$\£\-\(\)\d,\.%]+$/.test(val.replace(/\s+/g, '')) && val.length > 0;
                          return (
                            <td
                              key={cIdx}
                              className={`px-3 py-2 align-top ${
                                isNumeric ? 'font-mono tabular-nums text-right text-slate-900' : 'text-slate-700'
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={bIdx} className="whitespace-pre-line">
            {block.lines.join('\n')}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Normalises numeric, multi-select, matrix, sub-input, or text answers for accurate OTQ grading.
 */
export function checkOtAnswer(
  userAnswer: string | string[] | Record<string, string> | undefined,
  correctAnswer: string | string[],
  questionType: 'single' | 'multi' | 'numeric' | 'matrix' | 'interactive',
  matrix?: { rows: { id: string; correctColumn: string }[] },
  subInputs?: { id: string; correctAnswer: string }[]
): boolean {
  if (userAnswer === undefined) return false;

  const normalizeNum = (s: string) =>
    s
      .replace(/[,$£%\s‘’'"]/g, '')
      .replace(/\b(million|units?|hours?|hrs?|mins?|minutes?|days?|batches?|adverse|favourable|fav|adv|m)\b/gi, '')
      .replace(/([0-9])m$/i, '$1')
      .trim()
      .toLowerCase();

  const matchesSingleNumericOrText = (uRaw: string, cRaw: string): boolean => {
    const uClean = normalizeNum(uRaw);
    const cClean = normalizeNum(cRaw);
    if (!uClean || !cClean) return false;
    if (uClean === cClean) return true;

    const uNum = Number(uClean);
    const cNum = Number(cClean);
    if (!Number.isNaN(uNum) && !Number.isNaN(cNum)) {
      return Math.abs(uNum - cNum) <= Math.max(0.05, Math.abs(cNum) * 0.005);
    }
    return uRaw.trim().toLowerCase() === cRaw.trim().toLowerCase();
  };

  if (questionType === 'matrix' && matrix) {
    if (typeof userAnswer !== 'object' || Array.isArray(userAnswer)) return false;
    return matrix.rows.every(
      row =>
        (userAnswer[row.id] || '').trim().toLowerCase() ===
        row.correctColumn.trim().toLowerCase()
    );
  }

  if (subInputs && subInputs.length > 0) {
    if (typeof userAnswer !== 'object' || Array.isArray(userAnswer)) return false;
    return subInputs.every(sub =>
      matchesSingleNumericOrText(userAnswer[sub.id] || '', sub.correctAnswer)
    );
  }

  if (questionType === 'multi' && Array.isArray(correctAnswer)) {
    const ua = Array.isArray(userAnswer)
      ? [...userAnswer].map(v => v.trim().toUpperCase()).sort()
      : [];
    const ca = [...correctAnswer].map(v => v.trim().toUpperCase()).sort();
    return ua.length === ca.length && ua.every((v, idx) => v === ca[idx]);
  }

  if (typeof userAnswer !== 'string') return false;
  const cStr = Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer;

  if (questionType === 'single') {
    return userAnswer.trim().toUpperCase() === cStr.trim().toUpperCase();
  }

  return matchesSingleNumericOrText(userAnswer, cStr);
}
