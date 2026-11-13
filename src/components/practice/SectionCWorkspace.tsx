import React, { useState } from 'react';
import {
  AttemptRecord,
  MarkingCriterion,
  CRQRequirement,
  SpreadsheetData,
} from '../../types/pm';
import { StructuredContent } from '../../utils/formatText';
import { CbeSpreadsheet } from '../tools/CbeSpreadsheet';
import { CbeWordProcessor } from '../tools/CbeWordProcessor';
import { PdfPageViewer } from '../tools/PdfPageViewer';
import {
  Table,
  FileText,
  CheckSquare,
  Flag,
  BookOpen,
  Lightbulb,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

export interface CRQLikeQuestion {
  id: string;
  number?: number;
  title: string;
  sitting?: string;
  topicTitle: string;
  scenario: string;
  requirements: CRQRequirement[];
  totalMarks: number;
  modelAnswer: string;
  markingScheme: MarkingCriterion[];
  keyAnswerTip?: string;
  tutorialNote?: string;
  examinerComment?: string;
  hasDiagram?: boolean;
  hasDebrief?: boolean;
  pdfQuestionPage?: number;
  pdfAnswerPage?: number;
  diagramPage?: number;
}

interface SectionCWorkspaceProps {
  question: CRQLikeQuestion;
  attempt?: AttemptRecord;
  isFlagged: boolean;
  examMode?: boolean;
  onToggleFlag: () => void;
  onUpdateDraft: (
    patch: Partial<{
      sheetData: SpreadsheetData;
      wordText: string;
      rubricChecks: number[];
      selfScore: number;
      submitted: boolean;
    }>
  ) => void;
  onOpenKitPage?: (page: number) => void;
}

export function SectionCWorkspace({
  question,
  attempt,
  isFlagged,
  examMode = false,
  onToggleFlag,
  onUpdateDraft,
  onOpenKitPage,
}: SectionCWorkspaceProps) {
  const [rightTab, setRightTab] = useState<'spreadsheet' | 'word' | 'marking'>('spreadsheet');
  const [showPdfPage, setShowPdfPage] = useState<boolean>(Boolean(question.hasDiagram));

  const sheetData = attempt?.sheetData ?? {};
  const wordText = attempt?.wordText ?? '';
  const rubricChecks = attempt?.rubricChecks ?? [];

  const maxRubricMarks = question.markingScheme.reduce((sum, item) => sum + item.marks, 0) || question.totalMarks;
  const selfScore = rubricChecks.reduce(
    (sum, idx) => sum + (question.markingScheme[idx]?.marks ?? 0),
    0
  );

  const toggleRubricIndex = (idx: number) => {
    const exists = rubricChecks.includes(idx);
    const nextChecks = exists ? rubricChecks.filter(i => i !== idx) : [...rubricChecks, idx];
    const nextScore = nextChecks.reduce(
      (sum, i) => sum + (question.markingScheme[i]?.marks ?? 0),
      0
    );
    onUpdateDraft({
      rubricChecks: nextChecks,
      selfScore: nextScore,
      submitted: true,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {question.number && <span>Question {question.number}</span>}
            {question.sitting && (
              <>
                <span aria-hidden="true">·</span>
                <span>{question.sitting}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{question.topicTitle}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-medium text-slate-700">
              {question.totalMarks} Marks ({Math.round(question.totalMarks * 1.8)} mins)
            </span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mt-0.5">{question.title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {((!examMode && question.pdfQuestionPage) || (question.hasDiagram && (question.diagramPage || question.pdfQuestionPage))) && (
            <button
              type="button"
              onClick={() => setShowPdfPage(v => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {showPdfPage
                  ? 'Hide Kit Page'
                  : question.hasDiagram
                  ? `Show Diagram (p.${question.diagramPage || question.pdfQuestionPage})`
                  : `Kit Page p.${question.pdfQuestionPage}`}
              </span>
            </button>
          )}
          {onOpenKitPage && question.pdfQuestionPage && !examMode && (
            <button
              type="button"
              onClick={() => onOpenKitPage(question.pdfQuestionPage!)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-[#0369A1] hover:bg-sky-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Full Reader</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleFlag}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap shrink-0 cursor-pointer ${
              isFlagged
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
          </button>
        </div>
      </div>

      {/* Resizable/Split CBE Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Pane: Scenario & Requirements (5 cols on desktop) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-5 lg:max-h-[760px] lg:overflow-y-auto">
          {question.hasDiagram && (
            <div className="text-xs text-[#0369A1] bg-sky-50 border border-sky-200 rounded px-3 py-2">
              Diagram / chart question — original Kaplan Kit graph page is displayed below.
            </div>
          )}

          {showPdfPage && (question.diagramPage || question.pdfQuestionPage) && (!examMode || question.hasDiagram) && (
            <PdfPageViewer
              page={question.hasDiagram ? (question.diagramPage || question.pdfQuestionPage!) : question.pdfQuestionPage!}
              compact
              label={`${question.title} Source Page`}
            />
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Scenario & Exhibits
            </h3>
            <StructuredContent text={question.scenario} compact />
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Requirements
            </h3>
            <div className="space-y-2.5">
              {question.requirements.map((req, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">Part {req.label}</span>
                    <span className="font-mono tabular-nums">
                      {req.tool === 'spreadsheet'
                        ? 'Spreadsheet'
                        : req.tool === 'word'
                        ? 'Word Processor'
                        : 'Spreadsheet + Word'}
                      {req.marks > 0 ? ` · ${req.marks} marks` : ''}
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-slate-800">{req.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Spreadsheet, Word Processor, Self-Marking Rubric (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Segmented Tool Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
              <button
                type="button"
                onClick={() => setRightTab('spreadsheet')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
                  rightTab === 'spreadsheet'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Spreadsheet</span>
              </button>
              <button
                type="button"
                onClick={() => setRightTab('word')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
                  rightTab === 'word'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Word Processor</span>
              </button>
              {!examMode && (
                <button
                  type="button"
                  onClick={() => setRightTab('marking')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
                    rightTab === 'marking'
                      ? 'bg-[#B91C1C] text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Self-Mark & Model Answer</span>
                </button>
              )}
            </div>

            {attempt?.selfScore !== undefined && (
              <span className="text-xs font-mono tabular-nums font-semibold text-emerald-700 px-2">
                Self-Marked: {selfScore} / {maxRubricMarks}
              </span>
            )}
          </div>

          {rightTab === 'spreadsheet' && (
            <CbeSpreadsheet
              data={sheetData}
              onChange={next => onUpdateDraft({ sheetData: next })}
            />
          )}

          {rightTab === 'word' && (
            <CbeWordProcessor
              value={wordText}
              onChange={next => onUpdateDraft({ wordText: next })}
            />
          )}

          {rightTab === 'marking' && !examMode && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5 max-h-[700px] overflow-y-auto">
              {/* Interactive ACCA Marking Scheme Checklist */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      ACCA Self-Marking Rubric Checklist
                    </h3>
                    <p className="text-xs text-slate-500">
                      Compare your spreadsheet and written points against the Kaplan Model Answer below and tick earned marks.
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-mono tabular-nums font-semibold">
                    Score: {selfScore} / {maxRubricMarks} ({Math.round((selfScore / (maxRubricMarks || 1)) * 100)}%)
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                  {question.markingScheme.map((item, idx) => {
                    const checked = rubricChecks.includes(idx);
                    return (
                      <label
                        key={idx}
                        className={`flex items-start justify-between gap-3 p-3 text-xs cursor-pointer transition-colors ${
                          checked ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRubricIndex(idx)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#B91C1C]"
                          />
                          <span className={checked ? 'text-emerald-950 font-medium' : 'text-slate-700'}>
                            {item.label}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                          {item.marks} m
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Progress & self-assessed marks save automatically</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateDraft({
                        submitted: true,
                        selfScore,
                        rubricChecks,
                      })
                    }
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Mark Question Complete
                  </button>
                </div>
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

              {question.examinerComment && (
                <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-900">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Examiner&apos;s Comments</span>
                  </div>
                  <p className="text-[13px] text-rose-950 leading-relaxed">{question.examinerComment}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Official Model Answer & Workings
                  </h4>
                  {question.pdfAnswerPage && (
                    <span className="text-xs font-mono text-slate-500">
                      Kit Answer p.{question.pdfAnswerPage}
                    </span>
                  )}
                </div>
                <StructuredContent text={question.modelAnswer} compact />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
