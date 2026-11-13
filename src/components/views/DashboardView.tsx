import React, { useRef, useState } from 'react';
import syllabusTopics from '../../data/syllabusTopics.json';
import kitFrontMatter from '../../data/kitFrontMatter.json';
import sectionA from '../../data/sectionA.json';
import sectionB from '../../data/sectionB.json';
import sectionC from '../../data/sectionC.json';
import recentPreMocks from '../../data/recentPreMocks.json';
import flashcards from '../../data/flashcards.json';
import {
  AppView,
  ConfidenceLevel,
  OTQuestion,
  SectionBCase,
  SectionCQuestion,
  StudyStoreState,
  SyllabusTopic,
} from '../../types/pm';
import {
  BookOpen,
  Download,
  Upload,
  RotateCcw,
  ArrowRight,
  Clock,
  CheckCircle2,
  Flag,
  Flame,
} from 'lucide-react';
import { computeStudyStreak } from '../../store/useStudyStore';
import { DashboardWidget } from './DashboardWidget';

interface DashboardViewProps {
  store: StudyStoreState;
  onNavigate: (view: AppView) => void;
  onPracticeTopic: (topicId: string, section?: 'A' | 'B' | 'C') => void;
  onSetConfidence: (topicId: string, level: ConfidenceLevel) => void;
  onExportJson: () => void;
  onImportJson: (text: string) => { ok: boolean; message: string };
  onResetAll: () => void;
}

const CONFIDENCE_OPTIONS: Array<{ value: ConfidenceLevel; label: string }> = [
  { value: 'needs-review', label: 'Needs Review' },
  { value: 'developing', label: 'Developing' },
  { value: 'exam-ready', label: 'Exam Ready' },
];

export function DashboardView({
  store,
  onNavigate,
  onPracticeTopic,
  onSetConfidence,
  onExportJson,
  onImportJson,
  onResetAll,
}: DashboardViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importNotice, setImportNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const topics = syllabusTopics as SyllabusTopic[];
  const secA = sectionA as OTQuestion[];
  const secB = sectionB as SectionBCase[];
  const secC = sectionC as SectionCQuestion[];

  const totalSecA = secA.length;
  const totalSecBSub = secB.reduce((s, c) => s + c.subQuestions.length, 0);
  const totalSecC = secC.length;
  const totalPreMock = recentPreMocks.preMockCases.length;

  const attemptedSecA = secA.filter(q => store.attempts[q.id]?.submitted).length;
  const correctSecA = secA.filter(q => store.attempts[q.id]?.isCorrect).length;
  const attemptedSecC = secC.filter(q => store.attempts[q.id]?.submitted).length;
  const masteredCards = flashcards.filter(c => store.flashcardMastery[c.id] === 'mastered').length;
  const streak = computeStudyStreak(store.activityDates);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = onImportJson(String(reader.result || ''));
      setImportNotice({ ok: res.ok, text: res.message });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Hero / Study Overview */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-500">
            ACCA Applied Skills · Performance Management (PM) · {kitFrontMatter.edition}
          </p>
          <div
            className="flex items-center gap-2 text-xs font-medium text-slate-700"
            aria-label={`Daily study streak: ${streak.currentStreak} days`}
          >
            <Flame
              className={`w-4 h-4 shrink-0 ${
                streak.currentStreak > 0 ? 'text-[#B91C1C]' : 'text-slate-400'
              }`}
            />
            <span className="font-mono font-semibold tabular-nums text-slate-900">
              {streak.currentStreak} {streak.currentStreak === 1 ? 'day' : 'days'} streak
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className={streak.studiedToday ? 'text-emerald-700' : 'text-slate-500'}>
              {streak.studiedToday ? 'Studied today' : 'Log 1 practice item today'}
            </span>
            {streak.longestStreak > 0 && (
              <>
                <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-slate-500 hidden sm:inline">
                  Best {streak.longestStreak}d
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              Complete Kaplan Exam Kit & Pre-Mock Practice Hub
            </h1>
            <p className="text-[15px] text-slate-600 leading-relaxed">
              Study systematically by syllabus domain, drill all 309 Kaplan Exam Kit questions and the 32-question CBE Specimen Exam, practice 2024–2026 ACCA Pre-Mock cases, and self-mark Section C responses inside a live formula spreadsheet and word processor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('bank')}
              className="px-4 py-2.5 text-sm font-semibold bg-[#B91C1C] text-white rounded-lg hover:bg-[#991B1B] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Question Bank
            </button>
            <button
              type="button"
              onClick={() => onNavigate('premocks')}
              className="px-4 py-2.5 text-sm font-semibold bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              2024–2026 Pre-Mocks
            </button>
          </div>
        </div>

        {/* 4-column summary metrics row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-500">Section A OTQs</p>
            <p className="text-xl font-mono font-semibold tabular-nums text-slate-900 mt-1">
              {attemptedSecA} / {totalSecA}
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
              {correctSecA} correct
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Section B Case Items</p>
            <p className="text-xl font-mono font-semibold tabular-nums text-slate-900 mt-1">
              {secB.length} Cases
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
              {totalSecBSub} sub-questions
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Section C & Pre-Mocks</p>
            <p className="text-xl font-mono font-semibold tabular-nums text-slate-900 mt-1">
              {attemptedSecC} / {totalSecC + totalPreMock}
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
              {totalSecC} Kit CRQs · {totalPreMock} recent cases
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Flagged & Flashcards</p>
            <p className="text-xl font-mono font-semibold tabular-nums text-slate-900 mt-1">
              {masteredCards} / {flashcards.length}
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5 flex items-center gap-1">
              <Flag className="w-3 h-3 text-amber-600" />
              <span>{store.flagged.length} flagged for review</span>
            </p>
          </div>
        </div>
      </section>

      {/* Topic Proficiency Visualization */}
      <DashboardWidget
        topicConfidence={store.confidence}
        onSelectTopic={topicId => onPracticeTopic(topicId, 'A')}
      />

      {/* Syllabus Areas Breakdown */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Syllabus Mastery Tracker</h2>
            <p className="text-sm text-slate-600">
              Track topic coverage across all 5 ACCA Performance Management syllabus areas and launch targeted practice.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Recommended Pacing: 1.8 mins per mark
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
          {topics.map(topic => {
            const topicSecA = secA.filter(q => q.topicId === topic.id);
            const topicSecB = secB.filter(q => q.topicId === topic.id);
            const topicSecC = secC.filter(q => q.topicId === topic.id);
            const doneA = topicSecA.filter(q => store.attempts[q.id]?.submitted).length;
            const doneC = topicSecC.filter(q => store.attempts[q.id]?.submitted).length;
            const totalItems = topicSecA.length + topicSecB.length + topicSecC.length;
            const pct = totalItems > 0 ? Math.round(((doneA + doneC) / totalItems) * 100) : 0;
            const conf = store.confidence[topic.id] || 'needs-review';

            return (
              <div
                key={topic.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-800">
                      Syllabus Area {topic.code}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {topicSecA.length} Sec A · {topicSecB.length} Sec B · {topicSecC.length} Sec C
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-700">{pct}% completed</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{topic.title}</h3>
                  <div className="w-full max-w-md h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0369A1] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
                    {CONFIDENCE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onSetConfidence(topic.id, opt.value)}
                        className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
                          conf === opt.value
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onPracticeTopic(topic.id, 'A')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Practice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Kaplan 3-Stage Revision Plan & Detailed Plan */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Kaplan Detailed Revision Plan
              </h2>
              <p className="text-xs text-slate-500">
                Mapped directly from the 2026 Exam Kit front matter (pp. 18–28)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reader')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0369A1] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>View Kit Pages</span>
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {kitFrontMatter.detailedPlan.map((row, idx) => (
              <div key={row.topicId} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900">
                    {idx + 1}. {row.topic}
                  </div>
                  <span className="text-xs font-mono text-slate-500">{row.chapters}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{row.tutorGuidance}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {row.secAQuestions.length === 2 && (
                    <button
                      type="button"
                      onClick={() => onPracticeTopic(row.topicId, 'A')}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sec A: Q{row.secAQuestions[0]}–Q{row.secAQuestions[1]}
                    </button>
                  )}
                  {row.secBQuestions.length === 2 && (
                    <button
                      type="button"
                      onClick={() => onPracticeTopic(row.topicId, 'B')}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sec B: Q{row.secBQuestions[0]}–Q{row.secBQuestions[1]}
                    </button>
                  )}
                  {row.secCQuestions.length === 2 && (
                    <button
                      type="button"
                      onClick={() => onPracticeTopic(row.topicId, 'C')}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sec C: Q{row.secCQuestions[0]}–Q{row.secCQuestions[1]}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Exam Structure, Mock History & Data Backup */}
        <div className="lg:col-span-4 space-y-6">
          {/* Exam Format & Timing */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">PM Exam Blueprint</h2>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-2.5 text-xs">
              {kitFrontMatter.examFormat.sections.map(sec => (
                <div
                  key={sec.name}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{sec.name}</p>
                    <p className="text-slate-500">{sec.description}</p>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <p className="font-semibold text-slate-900">{sec.marks}m</p>
                    <p className="text-slate-500">{sec.recommendedMinutes} min</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 flex justify-between font-mono tabular-nums">
              <span>Pass Mark: {kitFrontMatter.examFormat.passMark}%</span>
              <span>Total: {kitFrontMatter.examFormat.durationMinutes} mins</span>
            </div>
          </div>

          {/* Recent Mock Attempts */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">CBE Mock Exam Scores</h2>
              <button
                type="button"
                onClick={() => onNavigate('mock')}
                className="text-xs font-semibold text-[#B91C1C] hover:underline cursor-pointer"
              >
                20-Mock Suite →
              </button>
            </div>
            {store.mockHistory.length === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                No timed mock exams completed yet. Launch the 20 Full-Syllabus CBE Mock Suite (featuring 15 Hardest-Possible Readiness papers covering 100% of Areas A–E) to benchmark exam readiness.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {store.mockHistory.slice(0, 5).map(run => {
                  const total = run.objectiveScore + run.sectionCSelfScore;
                  const max = run.objectiveTotal + run.sectionCTotal;
                  const pct = Math.round((total / (max || 100)) * 100);
                  return (
                    <div key={run.id} className="py-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{run.examTitle}</p>
                        <p className="text-slate-500">
                          {new Date(run.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          pct >= 50 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {total}/{max} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Browser Persistence & JSON Backup */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Progress Backup (JSON)</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your answers, Section C spreadsheets, self-marks, flags, and flashcards save locally in your browser. Export a JSON snapshot anytime.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onExportJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 bg-white border border-slate-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onResetAll();
                      setConfirmReset(false);
                      setImportNotice({ ok: true, text: 'Local study progress cleared.' });
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-rose-700 text-white rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {importNotice && (
              <p
                className={`text-xs flex items-center gap-1.5 ${
                  importNotice.ok ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{importNotice.text}</span>
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
