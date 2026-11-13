import React, { useState } from 'react';
import { OTQuestion, AttemptRecord } from '../../types/pm';
import { StructuredContent, checkOtAnswer } from '../../utils/formatText';
import { PdfPageViewer } from '../tools/PdfPageViewer';
import {
  Flag,
  CheckCircle2,
  XCircle,
  BookOpen,
  Lightbulb,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface OtQuestionCardProps {
  question: OTQuestion;
  prefixLabel?: string;
  attempt?: AttemptRecord;
  isFlagged: boolean;
  examMode?: boolean;
  onToggleFlag: () => void;
  onAnswer: (
    answer: string | string[] | Record<string, string>,
    isCorrect: boolean,
    submitted: boolean
  ) => void;
  onOpenKitPage?: (page: number) => void;
}

export function OtQuestionCard({
  question,
  prefixLabel,
  attempt,
  isFlagged,
  examMode = false,
  onToggleFlag,
  onAnswer,
  onOpenKitPage,
}: OtQuestionCardProps) {
  const initialDraft = (): string | string[] | Record<string, string> => {
    if (attempt?.answer !== undefined) return attempt.answer;
    if (question.questionType === 'multi') return [];
    if (question.questionType === 'matrix' || (question.subInputs && question.subInputs.length > 0)) {
      return {};
    }
    return '';
  };

  const [draft, setDraft] = useState<string | string[] | Record<string, string>>(initialDraft);
  const [showSolution, setShowSolution] = useState<boolean>(Boolean(attempt?.submitted) && !examMode);
  const [showPdfSnippet, setShowPdfSnippet] = useState<boolean>(question.hasDiagram);

  const currentAnswer = attempt?.answer ?? draft;
  const isSubmitted = Boolean(attempt?.submitted);
  const isCorrect = attempt?.isCorrect ?? false;

  const gradeAnswer = (ans: string | string[] | Record<string, string>) =>
    checkOtAnswer(
      ans,
      question.correctAnswer,
      question.questionType,
      question.matrix,
      question.subInputs
    );

  const handleSelectSingle = (key: string) => {
    setDraft(key);
    if (examMode) {
      onAnswer(key, gradeAnswer(key), false);
    }
  };

  const handleToggleMulti = (key: string) => {
    const arr = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
    const exists = arr.includes(key);
    const next = exists ? arr.filter(k => k !== key) : [...arr, key];
    setDraft(next);
    if (examMode) {
      onAnswer(next, gradeAnswer(next), false);
    }
  };

  const handleRecordChange = (rowOrSubId: string, val: string) => {
    const base =
      typeof currentAnswer === 'object' && !Array.isArray(currentAnswer)
        ? { ...currentAnswer }
        : {};
    const next = { ...base, [rowOrSubId]: val };
    setDraft(next);
    if (examMode) {
      onAnswer(next, gradeAnswer(next), false);
    }
  };

  const handleTextChange = (val: string) => {
    setDraft(val);
    if (examMode) {
      onAnswer(val, gradeAnswer(val), false);
    }
  };

  const handleSubmit = () => {
    const ans = currentAnswer;
    const ok = gradeAnswer(ans);
    onAnswer(ans, ok, true);
    setShowSolution(true);
  };

  const isAnswerComplete = (): boolean => {
    const ans = currentAnswer;
    if (question.questionType === 'matrix' && question.matrix) {
      if (typeof ans !== 'object' || Array.isArray(ans)) return false;
      return question.matrix.rows.every(r => Boolean((ans[r.id] || '').trim()));
    }
    if (question.subInputs && question.subInputs.length > 0) {
      if (typeof ans !== 'object' || Array.isArray(ans)) return false;
      return question.subInputs.every(s => Boolean((ans[s.id] || '').trim()));
    }
    if (question.questionType === 'multi') {
      return Array.isArray(ans) && ans.length > 0;
    }
    return typeof ans === 'string' && ans.trim() !== '';
  };

  const correctList = Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : [question.correctAnswer];

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Quiet unboxed metadata header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">
            {prefixLabel || `Question ${question.number}`}
          </span>
          {question.subtopic && (
            <>
              <span aria-hidden="true">·</span>
              <span>{question.subtopic}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{question.marks ?? 2} Marks</span>
          {question.hasDebrief && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#0369A1] font-medium">Tutor Debrief Question</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(!examMode || (question.hasDiagram && (question.diagramPage || question.pdfQuestionPage) > 0)) && (
            <button
              type="button"
              onClick={() => setShowPdfSnippet(v => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {showPdfSnippet
                  ? 'Hide Diagram Page'
                  : question.hasDiagram
                  ? `Show Diagram (p.${question.diagramPage || question.pdfQuestionPage})`
                  : `Kit Page p.${question.pdfQuestionPage}`}
              </span>
            </button>
          )}
          {onOpenKitPage && !examMode && (
            <button
              type="button"
              onClick={() => onOpenKitPage(question.pdfQuestionPage)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#0369A1] bg-white border border-slate-200 rounded hover:bg-sky-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Full Reader</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleFlag}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap shrink-0 cursor-pointer ${
              isFlagged
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {question.hasDiagram && (
          <div className="text-xs text-[#0369A1] bg-sky-50 border border-sky-200 rounded px-3 py-2">
            Diagram / chart question — the original Kaplan Kit diagram page is rendered below so all visual axes and curves are visible.
          </div>
        )}

        {showPdfSnippet && (!examMode || question.hasDiagram) && (question.diagramPage || question.pdfQuestionPage) > 0 && (
          <PdfPageViewer
            page={question.hasDiagram ? (question.diagramPage || question.pdfQuestionPage) : question.pdfQuestionPage}
            compact
            label={`Question ${question.number} Source Page`}
          />
        )}

        <StructuredContent text={question.prompt} />

        {/* Interactive Answer Controls */}
        {question.questionType === 'matrix' && question.matrix ? (
          question.matrix.mode === 'dropdown' ? (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
              {question.matrix.rows.map(row => {
                const selectedVal =
                  typeof currentAnswer === 'object' && !Array.isArray(currentAnswer)
                    ? currentAnswer[row.id] || ''
                    : '';
                const rowOk =
                  selectedVal.trim().toLowerCase() === row.correctColumn.trim().toLowerCase();
                return (
                  <div
                    key={row.id}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSubmitted && !examMode
                        ? rowOk
                          ? 'bg-emerald-50/50'
                          : 'bg-rose-50/50'
                        : ''
                    }`}
                  >
                    <span className="text-[13.5px] font-medium text-slate-800 flex-1">
                      {row.prompt}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={selectedVal}
                        disabled={isSubmitted && !examMode}
                        onChange={e => handleRecordChange(row.id, e.target.value)}
                        aria-label={row.prompt}
                        className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0369A1]"
                      >
                        <option value="">Select match...</option>
                        {question.matrix!.columns.map(col => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                      {isSubmitted && !examMode && !rowOk && (
                        <span className="text-xs font-mono text-emerald-700 font-semibold">
                          → {row.correctColumn}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <th className="px-3.5 py-2.5 font-semibold">Item / Statement</th>
                    {question.matrix.columns.map(col => (
                      <th key={col} className="px-3 py-2.5 font-semibold text-center whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {question.matrix.rows.map(row => {
                    const selectedVal =
                      typeof currentAnswer === 'object' && !Array.isArray(currentAnswer)
                        ? currentAnswer[row.id] || ''
                        : '';
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="px-3.5 py-3 text-slate-800 font-medium">{row.prompt}</td>
                        {question.matrix!.columns.map(col => {
                          const isSelected = selectedVal === col;
                          const isRightCol =
                            col.trim().toLowerCase() === row.correctColumn.trim().toLowerCase();
                          let cellBtn = 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100';
                          if (isSubmitted && !examMode) {
                            if (isRightCol) {
                              cellBtn = 'border-emerald-500 bg-emerald-600 text-white';
                            } else if (isSelected && !isRightCol) {
                              cellBtn = 'border-rose-500 bg-rose-600 text-white';
                            }
                          } else if (isSelected) {
                            cellBtn = 'border-[#0369A1] bg-[#0369A1] text-white';
                          }
                          return (
                            <td key={col} className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                disabled={isSubmitted && !examMode}
                                onClick={() => handleRecordChange(row.id, col)}
                                aria-label={`${row.prompt}: ${col}`}
                                className={`w-6 h-6 rounded-full border inline-flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default ${cellBtn}`}
                              >
                                {(isSelected || (isSubmitted && !examMode && isRightCol)) && (
                                  <span className="w-2 h-2 rounded-full bg-current" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : question.subInputs && question.subInputs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.subInputs.map(sub => {
              const val =
                typeof currentAnswer === 'object' && !Array.isArray(currentAnswer)
                  ? currentAnswer[sub.id] || ''
                  : '';
              const subOk = checkOtAnswer(val, sub.correctAnswer, 'numeric');
              return (
                <div key={sub.id} className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    {sub.label}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {sub.prefix && (
                      <span className="text-sm font-mono text-slate-500">{sub.prefix}</span>
                    )}
                    <input
                      type="text"
                      value={val}
                      onChange={e => handleRecordChange(sub.id, e.target.value)}
                      disabled={isSubmitted && !examMode}
                      placeholder="Enter value..."
                      className={`w-full px-3 py-2 text-sm font-mono bg-white border rounded-lg text-slate-900 focus:outline-none ${
                        isSubmitted && !examMode
                          ? subOk
                            ? 'border-emerald-400 bg-emerald-50/40'
                            : 'border-rose-400 bg-rose-50/40'
                          : 'border-slate-300 focus:border-[#0369A1]'
                      }`}
                    />
                    {sub.suffix && (
                      <span className="text-sm font-mono text-slate-500">{sub.suffix}</span>
                    )}
                  </div>
                  {isSubmitted && !examMode && !subOk && (
                    <p className="text-xs font-mono text-emerald-700">
                      Answer: {sub.prefix || ''}{sub.correctAnswer}{sub.suffix || ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : question.options.length > 0 ? (
          <div className="space-y-2">
            {question.questionType === 'multi' && (
              <p className="text-xs font-medium text-slate-500 font-mono tabular-nums">
                {question.selectCount <= 1
                  ? `Select all that apply (${Array.isArray(currentAnswer) ? currentAnswer.length : 0} selected):`
                  : `Select ${question.selectCount} options (${Array.isArray(currentAnswer) ? currentAnswer.length : 0} / ${question.selectCount} selected):`}
              </p>
            )}

            <div className="space-y-2">
              {question.options.map(opt => {
                const selected =
                  question.questionType === 'multi'
                    ? Array.isArray(currentAnswer) && currentAnswer.includes(opt.key)
                    : currentAnswer === opt.key;

                const isOptionCorrect = correctList.includes(opt.key);
                let rowStyle = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800';
                if (isSubmitted && !examMode) {
                  if (isOptionCorrect) {
                    rowStyle = 'border-emerald-300 bg-emerald-50/70 text-emerald-950';
                  } else if (selected && !isOptionCorrect) {
                    rowStyle = 'border-rose-300 bg-rose-50/70 text-rose-950';
                  }
                } else if (selected) {
                  rowStyle = 'border-[#0369A1] bg-sky-50/60 text-slate-900';
                }

                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={isSubmitted && !examMode}
                    onClick={() =>
                      question.questionType === 'multi'
                        ? handleToggleMulti(opt.key)
                        : handleSelectSingle(opt.key)
                    }
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border transition-colors cursor-pointer disabled:cursor-default ${rowStyle}`}
                  >
                    <span
                      className={`mt-0.5 w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-semibold shrink-0 border ${
                        selected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="text-[14px] leading-snug flex-1 pt-0.5">{opt.text}</span>
                    {isSubmitted && !examMode && isOptionCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                    )}
                    {isSubmitted && !examMode && selected && !isOptionCorrect && (
                      <XCircle className="w-4 h-4 text-rose-700 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">
              {question.questionType === 'numeric'
                ? 'Enter your calculated value (numbers/units will be checked with standard rounding tolerance):'
                : 'Enter your answer:'}
            </label>
            <input
              type="text"
              value={typeof currentAnswer === 'string' ? currentAnswer : ''}
              onChange={e => handleTextChange(e.target.value)}
              disabled={isSubmitted && !examMode}
              placeholder="Type your response here..."
              className="w-full max-w-md px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0369A1]"
            />
          </div>
        )}

        {/* Submit / Review Action Bar */}
        {!examMode && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              {!isSubmitted ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isAnswerComplete()}
                  className="px-4 py-2 text-xs font-semibold bg-[#B91C1C] text-white rounded-lg hover:bg-[#991B1B] disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Check Answer
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      isCorrect ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Incorrect · Answer: {question.answerKeyRaw}</span>
                      </>
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const resetVal =
                        question.questionType === 'multi'
                          ? []
                          : question.questionType === 'matrix' || (question.subInputs && question.subInputs.length > 0)
                          ? {}
                          : '';
                      setDraft(resetVal);
                      onAnswer(resetVal, false, false);
                      setShowSolution(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Retry Question
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowSolution(s => !s)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{showSolution ? 'Hide Worked Answer' : 'Show Worked Answer'}</span>
              {showSolution ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Kaplan Worked Solution & Pedagogical Notes */}
        {showSolution && !examMode && (
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Kaplan Worked Solution · Key: {question.answerKeyRaw}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Kit Answer p.{question.pdfAnswerPage}
                </span>
              </div>
              {question.explanation.trim().length <= 8 && question.options.length > 0 ? (
                <div className="space-y-1.5 text-[14px] text-slate-800">
                  <p className="font-medium text-slate-900">Verified Kit Answer:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {correctList.map(k => {
                      const matched = question.options.find(
                        o => o.key.toUpperCase() === k.toUpperCase()
                      );
                      return (
                        <li key={k}>
                          <span className="font-mono font-semibold">{k}:</span>{' '}
                          {matched ? matched.text : question.answerKeyRaw}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <StructuredContent text={question.explanation} compact />
              )}
            </div>

            {question.keyAnswerTip && (
              <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Key Answer Tip</span>
                </div>
                <p className="text-[13px] text-amber-950 leading-relaxed">{question.keyAnswerTip}</p>
              </div>
            )}

            {question.tutorialNote && (
              <div className="p-3.5 rounded-lg border border-sky-200 bg-sky-50/60 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-900">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Tutorial Note</span>
                </div>
                <p className="text-[13px] text-sky-950 leading-relaxed">{question.tutorialNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
