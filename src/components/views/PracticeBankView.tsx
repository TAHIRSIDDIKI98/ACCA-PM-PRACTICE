import React, { useEffect, useMemo, useState } from 'react';
import sectionA from '../../data/sectionA.json';
import sectionB from '../../data/sectionB.json';
import sectionC from '../../data/sectionC.json';
import syllabusTopics from '../../data/syllabusTopics.json';
import {
  OTQuestion,
  SectionBCase,
  SectionCQuestion,
  SpreadsheetData,
  StudyStoreState,
  SyllabusTopic,
} from '../../types/pm';
import { OtQuestionCard } from '../practice/OtQuestionCard';
import { SectionCWorkspace } from '../practice/SectionCWorkspace';
import { StructuredContent } from '../../utils/formatText';
import { PdfPageViewer } from '../tools/PdfPageViewer';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calculator,
  BookMarked,
  StickyNote,
  FileText,
  BookOpen,
} from 'lucide-react';

interface PracticeBankViewProps {
  store: StudyStoreState;
  initialSection?: 'A' | 'B' | 'C';
  initialTopicId?: string;
  initialQuestionNumber?: number | null;
  onRecordAttempt: (
    qId: string,
    answer: string | string[] | Record<string, string>,
    isCorrect: boolean,
    submitted: boolean
  ) => void;
  onUpdateCrqDraft: (
    qId: string,
    patch: Partial<{
      sheetData: SpreadsheetData;
      wordText: string;
      rubricChecks: number[];
      selfScore: number;
      submitted: boolean;
    }>
  ) => void;
  onToggleFlag: (qId: string) => void;
  onOpenKitPage: (page: number) => void;
  onOpenFormulae: () => void;
  onToggleCalc: () => void;
  onToggleScratchpad: () => void;
}

export function PracticeBankView({
  store,
  initialSection = 'A',
  initialTopicId = 'all',
  initialQuestionNumber = null,
  onRecordAttempt,
  onUpdateCrqDraft,
  onToggleFlag,
  onOpenKitPage,
  onOpenFormulae,
  onToggleCalc,
  onToggleScratchpad,
}: PracticeBankViewProps) {
  const secA = sectionA as OTQuestion[];
  const secB = sectionB as SectionBCase[];
  const secC = sectionC as SectionCQuestion[];
  const topics = syllabusTopics as SyllabusTopic[];

  const [section, setSection] = useState<'A' | 'B' | 'C'>(initialSection);
  const [topicFilter, setTopicFilter] = useState<string>(initialTopicId);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unattempted' | 'flagged' | 'diagram' | 'debrief'>('all');
  const [search, setSearch] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showSecBPdf, setShowSecBPdf] = useState<boolean>(false);

  useEffect(() => {
    setSection(initialSection);
    setTopicFilter(initialTopicId);
    if (initialQuestionNumber !== null) {
      if (initialSection === 'A') {
        const idx = secA.findIndex(q => q.number === initialQuestionNumber);
        if (idx >= 0) setActiveIndex(idx);
      } else if (initialSection === 'B') {
        const idx = secB.findIndex(c => c.number === initialQuestionNumber);
        if (idx >= 0) setActiveIndex(idx);
      } else {
        const idx = secC.findIndex(c => c.number === initialQuestionNumber);
        if (idx >= 0) setActiveIndex(idx);
      }
    } else {
      setActiveIndex(0);
    }
  }, [initialSection, initialTopicId, initialQuestionNumber, secA, secB, secC]);

  const filteredSecA = useMemo(() => {
    const q = search.trim().toLowerCase();
    return secA.filter(item => {
      if (topicFilter !== 'all' && item.topicId !== topicFilter) return false;
      if (statusFilter === 'unattempted' && store.attempts[item.id]?.submitted) return false;
      if (statusFilter === 'flagged' && !store.flagged.includes(item.id)) return false;
      if (statusFilter === 'diagram' && !item.hasDiagram) return false;
      if (statusFilter === 'debrief' && !item.hasDebrief) return false;
      if (!q) return true;
      return (
        String(item.number) === q ||
        item.prompt.toLowerCase().includes(q) ||
        (item.subtopic || '').toLowerCase().includes(q)
      );
    });
  }, [secA, topicFilter, statusFilter, search, store.attempts, store.flagged]);

  const filteredSecB = useMemo(() => {
    const q = search.trim().toLowerCase();
    return secB.filter(item => {
      if (topicFilter !== 'all' && item.topicId !== topicFilter) return false;
      if (statusFilter === 'flagged' && !store.flagged.includes(item.id)) return false;
      if (statusFilter === 'diagram' && !item.hasDiagram) return false;
      if (statusFilter === 'debrief' && !item.hasDebrief) return false;
      if (statusFilter === 'unattempted') {
        const allDone = item.subQuestions.every(
          sq => store.attempts[`${item.id}-q${sq.number}`]?.submitted
        );
        if (allDone) return false;
      }
      if (!q) return true;
      return (
        String(item.number) === q ||
        item.title.toLowerCase().includes(q) ||
        item.scenario.toLowerCase().includes(q)
      );
    });
  }, [secB, topicFilter, statusFilter, search, store.attempts, store.flagged]);

  const filteredSecC = useMemo(() => {
    const q = search.trim().toLowerCase();
    return secC.filter(item => {
      if (topicFilter !== 'all' && item.topicId !== topicFilter) return false;
      if (statusFilter === 'unattempted' && store.attempts[item.id]?.submitted) return false;
      if (statusFilter === 'flagged' && !store.flagged.includes(item.id)) return false;
      if (statusFilter === 'diagram' && !item.hasDiagram) return false;
      if (statusFilter === 'debrief' && !item.hasDebrief) return false;
      if (!q) return true;
      return (
        String(item.number) === q ||
        item.title.toLowerCase().includes(q) ||
        item.scenario.toLowerCase().includes(q) ||
        item.sitting.toLowerCase().includes(q)
      );
    });
  }, [secC, topicFilter, statusFilter, search, store.attempts, store.flagged]);

  const activeList =
    section === 'A' ? filteredSecA : section === 'B' ? filteredSecB : filteredSecC;
  const safeIdx = activeList.length ? Math.min(activeIndex, activeList.length - 1) : 0;

  return (
    <div className="space-y-4">
      {/* Section Switcher & Tools Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-md">
            <button
              type="button"
              onClick={() => {
                setSection('A');
                setActiveIndex(0);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap shrink-0 cursor-pointer ${
                section === 'A' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Section A OTQs ({secA.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSection('B');
                setActiveIndex(0);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap shrink-0 cursor-pointer ${
                section === 'B' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Section B Cases ({secB.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSection('C');
                setActiveIndex(0);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap shrink-0 cursor-pointer ${
                section === 'C' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Section C CRQs ({secC.length})
            </button>
          </div>
        </div>

        {/* CBE Tools */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenFormulae}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookMarked className="w-3.5 h-3.5 text-slate-500" />
            <span>Formulae</span>
          </button>
          <button
            type="button"
            onClick={onToggleCalc}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-500" />
            <span>Calculator</span>
          </button>
          <button
            type="button"
            onClick={onToggleScratchpad}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <StickyNote className="w-3.5 h-3.5 text-slate-500" />
            <span>Scratchpad</span>
          </button>
        </div>
      </div>

      {/* Filters + Question Selector Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[210px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Search Q#, company, topic..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#0369A1]"
            />
          </div>

          <select
            value={topicFilter}
            onChange={e => {
              setTopicFilter(e.target.value);
              setActiveIndex(0);
            }}
            aria-label="Filter by syllabus area"
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="all">All Syllabus Areas</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>
                {t.code}. {t.shortTitle}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setActiveIndex(0);
            }}
            aria-label="Filter by status"
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="all">All Questions</option>
            <option value="unattempted">Unattempted Only</option>
            <option value="flagged">Flagged Only</option>
            <option value="diagram">Diagram / Chart Questions</option>
            <option value="debrief">Tutor Debrief Questions</option>
          </select>
        </div>

        {/* Question Jump Dropdown + Prev/Next */}
        {activeList.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={safeIdx}
              onChange={e => setActiveIndex(Number(e.target.value))}
              aria-label="Select specific question"
              className="max-w-[230px] px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900"
            >
              {activeList.map((item, idx) => {
                const label =
                  'title' in item
                    ? `Q${item.number} · ${item.title}`
                    : `Q${item.number} · ${item.subtopic || 'OTQ'}`;
                return (
                  <option key={item.id} value={idx}>
                    {label.slice(0, 42)}
                  </option>
                );
              })}
            </select>

            <span className="text-xs font-mono tabular-nums text-slate-500">
              {safeIdx + 1} / {activeList.length}
            </span>

            <button
              type="button"
              onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
              disabled={safeIdx === 0}
              aria-label="Previous question"
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex(i => Math.min(activeList.length - 1, i + 1))}
              disabled={safeIdx >= activeList.length - 1}
              aria-label="Next question"
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Active Question Stage */}
      {activeList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
          <p className="text-sm font-medium text-slate-800">
            No questions match your current filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setTopicFilter('all');
              setStatusFilter('all');
              setSearch('');
            }}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : section === 'A' ? (
        <OtQuestionCard
          key={(activeList[safeIdx] as OTQuestion).id}
          question={activeList[safeIdx] as OTQuestion}
          prefixLabel={`Section A · Question ${(activeList[safeIdx] as OTQuestion).number}`}
          attempt={store.attempts[(activeList[safeIdx] as OTQuestion).id]}
          isFlagged={store.flagged.includes((activeList[safeIdx] as OTQuestion).id)}
          onToggleFlag={() => onToggleFlag((activeList[safeIdx] as OTQuestion).id)}
          onAnswer={(ans, ok, sub) =>
            onRecordAttempt((activeList[safeIdx] as OTQuestion).id, ans, ok, sub)
          }
          onOpenKitPage={onOpenKitPage}
        />
      ) : section === 'B' ? (
        (() => {
          const activeCase = activeList[safeIdx] as SectionBCase;
          return (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Section B Case · Q{activeCase.number}</span>
                    {activeCase.sitting && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{activeCase.sitting}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{activeCase.topicTitle}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">5 Questions (10 Marks)</span>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
                    {activeCase.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSecBPdf(v => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {showSecBPdf ? 'Hide Kit Page' : `Kit Page p.${activeCase.pdfQuestionPage}`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenKitPage(activeCase.pdfQuestionPage)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-[#0369A1] hover:bg-sky-50 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Full Reader</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4 lg:sticky lg:top-4 lg:max-h-[760px] lg:overflow-y-auto">
                  {(showSecBPdf || activeCase.hasDiagram) && (
                    <PdfPageViewer
                      page={activeCase.hasDiagram ? (activeCase.diagramPage || activeCase.pdfQuestionPage) : activeCase.pdfQuestionPage}
                      compact
                      label={`${activeCase.title} Source Page`}
                    />
                  )}
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Case Scenario
                  </h3>
                  <StructuredContent text={activeCase.scenario} compact />
                </div>

                <div className="lg:col-span-7 space-y-4">
                  {activeCase.subQuestions.map(sq => {
                    const qKey = `${activeCase.id}-q${sq.number}`;
                    return (
                      <OtQuestionCard
                        key={qKey}
                        question={
                          activeCase.hasDiagram ? { ...sq, hasDiagram: false } : sq
                        }
                        prefixLabel={`${activeCase.title} · Part ${sq.number} of 5`}
                        attempt={store.attempts[qKey]}
                        isFlagged={store.flagged.includes(qKey)}
                        onToggleFlag={() => onToggleFlag(qKey)}
                        onAnswer={(ans, ok, sub) => onRecordAttempt(qKey, ans, ok, sub)}
                        onOpenKitPage={onOpenKitPage}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        (() => {
          const crq = activeList[safeIdx] as SectionCQuestion;
          return (
            <SectionCWorkspace
              key={crq.id}
              question={crq}
              attempt={store.attempts[crq.id]}
              isFlagged={store.flagged.includes(crq.id)}
              onToggleFlag={() => onToggleFlag(crq.id)}
              onUpdateDraft={patch => onUpdateCrqDraft(crq.id, patch)}
              onOpenKitPage={onOpenKitPage}
            />
          );
        })()
      )}
    </div>
  );
}
