import React, { useCallback, useEffect, useMemo, useState } from 'react';
import specimenExam from '../../data/specimenExam.json';
import sectionA from '../../data/sectionA.json';
import sectionB from '../../data/sectionB.json';
import sectionC from '../../data/sectionC.json';
import recentPreMocks from '../../data/recentPreMocks.json';
import mockExamsData from '../../data/mockExams.json';
import syllabusTopics from '../../data/syllabusTopics.json';
import {
  AttemptRecord,
  CuratedMockExam,
  MockRunRecord,
  OTQuestion,
  PreMockCase,
  SectionBCase,
  SectionCQuestion,
  SpreadsheetData,
  StudyStoreState,
  SyllabusTopic,
} from '../../types/pm';
import { OtQuestionCard } from '../practice/OtQuestionCard';
import { SectionCWorkspace } from '../practice/SectionCWorkspace';
import { PdfPageViewer } from '../tools/PdfPageViewer';
import { StructuredContent, checkOtAnswer } from '../../utils/formatText';
import {
  Clock,
  Flag,
  Grid,
  BookMarked,
  Calculator,
  StickyNote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  ShieldCheck,
  Award,
  Flame,
} from 'lucide-react';

interface MockExamViewProps {
  store: StudyStoreState;
  onExitExam: () => void;
  onSaveMockRun: (run: MockRunRecord) => void;
  onOpenFormulae: () => void;
  onToggleCalc: () => void;
  onToggleScratchpad: () => void;
}

type ExamNavItem =
  | { type: 'secA'; idx: number; label: string; question: OTQuestion }
  | {
      type: 'secB';
      caseIdx: number;
      subIdx: number;
      label: string;
      scenario: string;
      caseTitle: string;
      hasDiagram?: boolean;
      pdfQuestionPage?: number;
      diagramPage?: number;
      question: OTQuestion;
    }
  | { type: 'secC'; idx: number; label: string; question: SectionCQuestion };

type MockSelection =
  | { kind: 'curated'; mockId: string }
  | { kind: 'specimen' }
  | { kind: 'kit-random' };

type MockCatalogTab = 'hardcore15' | 'consolidation' | 'all20' | 'special';

interface MockExamPaper {
  mockId: string;
  title: string;
  secA: OTQuestion[];
  secB: Array<{
    id: string;
    title: string;
    scenario: string;
    hasDiagram?: boolean;
    pdfQuestionPage?: number;
    diagramPage?: number;
    subQuestions: OTQuestion[];
  }>;
  secC: SectionCQuestion[];
}

function preMockToSectionC(pm: PreMockCase, idx: number): SectionCQuestion {
  return {
    id: pm.id,
    number: 900 + idx,
    title: pm.title,
    sitting: pm.sitting,
    topicId: pm.topicId,
    topicTitle: pm.topicTitle,
    scenario: pm.scenario,
    requirements: pm.requirements,
    rawRequired: pm.requirements.map(r => `${r.label} ${r.text}`).join('\n'),
    totalMarks: pm.totalMarks,
    modelAnswer: pm.modelAnswer,
    markingScheme: pm.markingScheme,
    keyAnswerTip: pm.keyAnswerTip,
    tutorialNote: '',
    examinerComment: pm.examinerComment,
    hasDiagram: false,
    pdfQuestionPage: 0,
    pdfAnswerPage: 0,
  };
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function generateKitMockPaper(): MockExamPaper {
  const allA = sectionA as OTQuestion[];
  const allB = sectionB as SectionBCase[];
  const allC = (sectionC as SectionCQuestion[]).filter(q => q.totalMarks === 20);
  const topics = syllabusTopics as SyllabusTopic[];

  const pickedA: OTQuestion[] = [];
  topics.forEach(t => {
    const pool = allA.filter(q => q.topicId === t.id);
    pickedA.push(...pickRandom(pool, 3));
  });

  const pickedB = pickRandom(allB, 3).map(c => ({
    id: c.id,
    title: c.title,
    scenario: c.scenario,
    hasDiagram: c.hasDiagram,
    pdfQuestionPage: c.pdfQuestionPage,
    diagramPage: c.diagramPage,
    subQuestions: c.subQuestions,
  }));

  const shuffledC = pickRandom(allC, allC.length);
  const firstC = shuffledC[0];
  const secondC = shuffledC.find(q => q.topicId !== firstC?.topicId) || shuffledC[1];

  return {
    mockId: 'kit-random',
    title: 'Kaplan Kit Full Mock (Weighted Random · 100 Marks)',
    secA: pickedA.map((q, idx) => ({ ...q, number: idx + 1 })),
    secB: pickedB,
    secC: [firstC, secondC].filter(Boolean),
  };
}

export function MockExamView({
  store,
  onExitExam,
  onSaveMockRun,
  onOpenFormulae,
  onToggleCalc,
  onToggleScratchpad,
}: MockExamViewProps) {
  const curatedMocks = mockExamsData as CuratedMockExam[];

  // Build fast lookup maps across Kit, Specimen, and Pre-Mock banks
  const lookupMaps = useMemo(() => {
    const mapA = new Map<string, OTQuestion>();
    (sectionA as OTQuestion[]).forEach(q => mapA.set(q.id, q));
    (specimenExam.sectionA as OTQuestion[]).forEach(q => mapA.set(q.id, q));

    const mapB = new Map<
      string,
      {
        id: string;
        title: string;
        scenario: string;
        hasDiagram?: boolean;
        pdfQuestionPage?: number;
        diagramPage?: number;
        subQuestions: OTQuestion[];
      }
    >();
    (sectionB as SectionBCase[]).forEach(c =>
      mapB.set(c.id, {
        id: c.id,
        title: c.title,
        scenario: c.scenario,
        hasDiagram: c.hasDiagram,
        pdfQuestionPage: c.pdfQuestionPage,
        diagramPage: c.diagramPage,
        subQuestions: c.subQuestions,
      })
    );
    specimenExam.sectionB.forEach(c =>
      mapB.set(c.id, {
        id: c.id,
        title: c.title,
        scenario: c.scenario,
        hasDiagram: c.hasDiagram,
        pdfQuestionPage: c.pdfQuestionPage,
        subQuestions: c.subQuestions as OTQuestion[],
      })
    );

    const mapC = new Map<string, SectionCQuestion>();
    (sectionC as SectionCQuestion[]).forEach(q => mapC.set(q.id, q));
    (recentPreMocks.preMockCases as PreMockCase[]).forEach((pm, idx) =>
      mapC.set(pm.id, preMockToSectionC(pm, idx + 1))
    );

    return { mapA, mapB, mapC };
  }, []);

  const [catalogTab, setCatalogTab] = useState<MockCatalogTab>('hardcore15');
  const [selection, setSelection] = useState<MockSelection>({
    kind: 'curated',
    mockId: 'mock-01',
  });
  const [generatedPaper, setGeneratedPaper] = useState<MockExamPaper | null>(null);

  const activePaper: MockExamPaper = useMemo(() => {
    if (selection.kind === 'kit-random' && generatedPaper) {
      return generatedPaper;
    }
    if (selection.kind === 'curated') {
      const blueprint = curatedMocks.find(m => m.id === selection.mockId) || curatedMocks[0];
      const secAResolved = blueprint.secAIds
        .map((id, idx) => {
          const item = lookupMaps.mapA.get(id);
          return item ? { ...item, number: idx + 1 } : null;
        })
        .filter((x): x is OTQuestion => x !== null);
      const secBResolved = blueprint.secBIds
        .map(id => lookupMaps.mapB.get(id))
        .filter(
          (
            x
          ): x is {
            id: string;
            title: string;
            scenario: string;
            hasDiagram?: boolean;
            pdfQuestionPage?: number;
            diagramPage?: number;
            subQuestions: OTQuestion[];
          } => Boolean(x)
        );
      const secCResolved = blueprint.secCIds
        .map(id => lookupMaps.mapC.get(id))
        .filter((x): x is SectionCQuestion => Boolean(x));

      return {
        mockId: blueprint.id,
        title: blueprint.title,
        secA: secAResolved,
        secB: secBResolved,
        secC: secCResolved,
      };
    }
    return {
      mockId: 'specimen',
      title: 'Kaplan CBE Specimen Exam (100 Marks)',
      secA: specimenExam.sectionA as OTQuestion[],
      secB: specimenExam.sectionB.map(c => ({
        id: c.id,
        title: c.title,
        scenario: c.scenario,
        hasDiagram: c.hasDiagram,
        pdfQuestionPage: c.pdfQuestionPage,
        subQuestions: c.subQuestions as OTQuestion[],
      })),
      secC: specimenExam.sectionC as SectionCQuestion[],
    };
  }, [selection, generatedPaper, curatedMocks, lookupMaps]);

  const navItems: ExamNavItem[] = useMemo(() => {
    const list: ExamNavItem[] = [];
    activePaper.secA.forEach((q, idx) => {
      list.push({ type: 'secA', idx, label: `A${idx + 1}`, question: q });
    });
    let bCounter = 16;
    activePaper.secB.forEach((c, cIdx) => {
      c.subQuestions.forEach((sq, sIdx) => {
        const subWithId: OTQuestion = {
          ...sq,
          id: `${c.id}-q${sq.number}`,
          hasDiagram: c.hasDiagram ? false : sq.hasDiagram,
        };
        list.push({
          type: 'secB',
          caseIdx: cIdx,
          subIdx: sIdx,
          label: `B${bCounter}`,
          scenario: c.scenario,
          caseTitle: c.title,
          hasDiagram: c.hasDiagram,
          pdfQuestionPage: c.pdfQuestionPage,
          diagramPage: c.diagramPage,
          question: subWithId,
        });
        bCounter += 1;
      });
    });
    activePaper.secC.forEach((q, idx) => {
      list.push({ type: 'secC', idx, label: `C${idx + 1}`, question: q });
    });
    return list;
  }, [activePaper]);

  const [started, setStarted] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(180 * 60);
  const [cursor, setCursor] = useState<number>(0);
  const [showNavGrid, setShowNavGrid] = useState<boolean>(false);
  const [confirmEnd, setConfirmEnd] = useState<boolean>(false);
  const [runId, setRunId] = useState<string>('');

  const [examAttempts, setExamAttempts] = useState<Record<string, AttemptRecord>>({});
  const [examFlags, setExamFlags] = useState<string[]>([]);

  const objectiveTotalMarks =
    activePaper.secA.length * 2 +
    activePaper.secB.reduce((s, c) => s + c.subQuestions.length * 2, 0);
  const sectionCTotalMarks = activePaper.secC.reduce((s, q) => s + q.totalMarks, 0);

  const computeAndSaveRun = useCallback(
    (
      targetRunId: string,
      attemptsSnapshot: Record<string, AttemptRecord>,
      secsRemaining: number
    ) => {
      let objScore = 0;
      activePaper.secA.forEach(q => {
        if (attemptsSnapshot[q.id]?.isCorrect) objScore += 2;
      });
      activePaper.secB.forEach(c => {
        c.subQuestions.forEach(sq => {
          const subId = `${c.id}-q${sq.number}`;
          if (attemptsSnapshot[subId]?.isCorrect) objScore += 2;
        });
      });

      const secCScore = activePaper.secC.reduce(
        (s, q) => s + (attemptsSnapshot[q.id]?.selfScore ?? 0),
        0
      );

      onSaveMockRun({
        id: targetRunId,
        mockId: activePaper.mockId,
        examTitle: activePaper.title,
        completedAt: Date.now(),
        durationUsedSeconds: 180 * 60 - secsRemaining,
        objectiveScore: objScore,
        objectiveTotal: objectiveTotalMarks,
        sectionCSelfScore: secCScore,
        sectionCTotal: sectionCTotalMarks,
      });
    },
    [activePaper, objectiveTotalMarks, sectionCTotalMarks, onSaveMockRun]
  );

  const launchExamPaper = (nextSelection: MockSelection, forceRandom = false) => {
    if (nextSelection.kind === 'kit-random' && (forceRandom || !generatedPaper)) {
      setGeneratedPaper(generateKitMockPaper());
    }
    setSelection(nextSelection);
    setExamAttempts({});
    setExamFlags([]);
    setCursor(0);
    setSecondsLeft(180 * 60);
    setSubmitted(false);
    setConfirmEnd(false);
    setShowNavGrid(false);
    setRunId(`mock-${Date.now()}`);
    setStarted(true);
  };

  const handleFinishExam = useCallback(() => {
    const newRunId = runId || `mock-${Date.now()}`;
    setRunId(newRunId);
    setSubmitted(true);
    setConfirmEnd(false);
    computeAndSaveRun(newRunId, examAttempts, secondsLeft);
  }, [runId, examAttempts, secondsLeft, computeAndSaveRun]);

  useEffect(() => {
    if (!started || submitted) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [started, submitted]);

  useEffect(() => {
    if (started && !submitted && secondsLeft === 0) {
      handleFinishExam();
    }
  }, [started, submitted, secondsLeft, handleFinishExam]);

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentItem = navItems[cursor];
  const currentId = currentItem.question.id;

  const toggleFlag = (id: string) => {
    setExamFlags(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const recordOt = (
    id: string,
    q: OTQuestion,
    ans: string | string[] | Record<string, string>
  ) => {
    const ok = checkOtAnswer(ans, q.correctAnswer, q.questionType, q.matrix, q.subInputs);
    setExamAttempts(prev => ({
      ...prev,
      [id]: {
        questionId: id,
        answer: ans,
        isCorrect: ok,
        submitted: true,
        updatedAt: Date.now(),
      },
    }));
  };

  const updateCrq = (
    id: string,
    patch: Partial<{
      sheetData: SpreadsheetData;
      wordText: string;
      rubricChecks: number[];
      selfScore: number;
      submitted: boolean;
    }>
  ) => {
    setExamAttempts(prev => {
      const existing = prev[id] ?? {
        questionId: id,
        answer: '',
        submitted: false,
        updatedAt: Date.now(),
      };
      const nextSnapshot = {
        ...prev,
        [id]: { ...existing, ...patch, updatedAt: Date.now() },
      };
      if (submitted && runId && patch.selfScore !== undefined) {
        computeAndSaveRun(runId, nextSnapshot, secondsLeft);
      }
      return nextSnapshot;
    });
  };

  // Pre-Exam Mock Library & Launcher
  if (!started) {
    const bestByMockId = new Map<string, MockRunRecord>();
    store.mockHistory.forEach(run => {
      const key = run.mockId || (run.examTitle.includes('Specimen') ? 'specimen' : run.examTitle);
      const total = run.objectiveScore + run.sectionCSelfScore;
      const existing = bestByMockId.get(key);
      if (!existing || total > existing.objectiveScore + existing.sectionCSelfScore) {
        bestByMockId.set(key, run);
      }
    });

    const completedCuratedCount = curatedMocks.filter(m => bestByMockId.has(m.id)).length;
    const completedHardcore15Count = curatedMocks
      .slice(0, 15)
      .filter(m => bestByMockId.has(m.id)).length;

    const displayedMocks =
      catalogTab === 'hardcore15'
        ? curatedMocks.slice(0, 15)
        : catalogTab === 'consolidation'
        ? curatedMocks.slice(15)
        : catalogTab === 'all20'
        ? curatedMocks
        : [];

    const activeCurated =
      selection.kind === 'curated'
        ? curatedMocks.find(m => m.id === selection.mockId) || curatedMocks[0]
        : null;

    return (
      <div className="space-y-6">
        {/* Executive Header Banner */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#B91C1C]">
                <Flame className="w-3.5 h-3.5" />
                <span>20 Full-Syllabus ACCA PM Mock Exams · 100 Marks · 3 Hours Each</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                100%-Syllabus Hardcore CBE Mock Suite
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every mock spans <strong className="font-semibold text-slate-900">all 5 ACCA PM Syllabus Areas (A–E)</strong> with 15 Section A OTQs, 3 Section B case studies, and 2 distinct-area 20-mark CRQs. Mocks 01–15 front-load the hardest numerics, matrices, capacity-constrained transfer pricing, ex-post variances, and 2025–2026 Pre-Mocks so you build 100% exam readiness.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="border border-slate-200 rounded-lg px-4 py-2.5 text-center">
                <div className="text-[11px] text-slate-500">Readiness 1–15</div>
                <div className="text-lg font-mono font-bold tabular-nums text-slate-900">
                  {completedHardcore15Count} / 15
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg px-4 py-2.5 text-center">
                <div className="text-[11px] text-slate-500">All 20 Mocks</div>
                <div className="text-lg font-mono font-bold tabular-nums text-slate-900">
                  {completedCuratedCount} / 20
                </div>
              </div>
              <button
                type="button"
                onClick={onExitExam}
                className="px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Back to Hub
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-200">
            {[
              { id: 'hardcore15' as const, label: '15 Hardest Readiness Mocks (01–15)' },
              { id: 'consolidation' as const, label: 'Kit Consolidation Mocks (16–20)' },
              { id: 'all20' as const, label: 'All 20 Full-Syllabus Mocks' },
              { id: 'special' as const, label: 'Specimen Exam & Weighted Randomizer' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCatalogTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  catalogTab === tab.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Curated Mocks Grid OR Special Modes */}
        {catalogTab !== 'special' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayedMocks.map(mock => {
              const best = bestByMockId.get(mock.id);
              const bestTotal = best ? best.objectiveScore + best.sectionCSelfScore : null;
              const isSelected = selection.kind === 'curated' && selection.mockId === mock.id;
              const tierStyle = mock.tier.includes('Max Challenge')
                ? 'bg-red-50 text-[#B91C1C] border-red-200'
                : mock.tier.includes('Very Hard')
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200';

              return (
                <div
                  key={mock.id}
                  onClick={() => setSelection({ kind: 'curated', mockId: mock.id })}
                  className={`bg-white rounded-lg border p-5 space-y-3.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 ring-1 ring-slate-900'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded border ${tierStyle}`}
                        >
                          {mock.tier}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>100% Syllabus (5/5 Areas)</span>
                        </span>
                      </div>
                      <h2 className="text-base font-semibold text-slate-900">{mock.title}</h2>
                    </div>

                    {bestTotal !== null && (
                      <div
                        className={`text-right shrink-0 px-2.5 py-1 rounded border text-xs font-mono tabular-nums font-semibold ${
                          bestTotal >= 50
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <Award className="w-3 h-3 inline mr-1" />
                        {bestTotal}/100
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{mock.focus}</p>

                  {/* Exact Syllabus Area Weighting */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono tabular-nums">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map(code => (
                      <span
                        key={code}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        Area {code}: {mock.areaMarks[code]}m
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-mono text-slate-500">
                      {mock.subtopicCount} subtopics · {mock.formatMix.numeric} Num ·{' '}
                      {mock.formatMix.matrix} Matrix · {mock.formatMix.multi} Multi
                    </div>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        launchExamPaper({ kind: 'curated', mockId: mock.id });
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-[#B91C1C] text-white rounded-lg hover:bg-[#991B1B] cursor-pointer"
                    >
                      {best ? 'Retake Mock' : 'Start Exam'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">
                  Kaplan Kit Section 7 · Fixed Official Paper
                </span>
                <h2 className="text-lg font-bold text-slate-900">Official CBE Specimen Exam</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Exact 32-question specimen paper from the Kaplan Kit (Glam Co, Chair Co, Hi Life Co, Carad Co, Thatcher International Park) covering 100 marks over 3 hours.
                </p>
              </div>
              <button
                type="button"
                onClick={() => launchExamPaper({ kind: 'specimen' })}
                className="w-full py-2.5 text-xs font-semibold bg-[#B91C1C] text-white rounded-lg hover:bg-[#991B1B] cursor-pointer"
              >
                Start Official Specimen Exam
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">
                  Dynamic Generator · Unlimited Re-Draws
                </span>
                <h2 className="text-lg font-bold text-slate-900">Randomized Full Kaplan Kit Mock</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Draws a fresh 100-mark paper balanced across all 5 syllabus areas (15 Section A + 3 Section B cases + 2 distinct-area 20-mark Section C CRQs).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => launchExamPaper({ kind: 'kit-random' }, true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Generate & Start Fresh Paper</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Paper Quick Blueprint Footer when viewing a curated tab */}
        {activeCurated && catalogTab !== 'special' && (
          <div className="bg-slate-900 text-white rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono text-slate-300">
                Selected Blueprint · {activeCurated.tier} · {activeCurated.subtopicCount} Subtopics Covered
              </div>
              <div className="text-base font-bold">{activePaper.title}</div>
              <div className="text-xs text-slate-300">
                Sec A: {activePaper.secA.length} OTQs (30m) · Sec B: {activePaper.secB.map(c => c.title).join(', ')} (30m) · Sec C: {activePaper.secC.map(c => c.title).join(' & ')} (40m)
              </div>
            </div>
            <button
              type="button"
              onClick={() => launchExamPaper({ kind: 'curated', mockId: activeCurated.id })}
              className="px-5 py-2.5 text-sm font-semibold bg-[#B91C1C] text-white rounded-lg hover:bg-[#991B1B] shrink-0 cursor-pointer"
            >
              Start Selected 3-Hour CBE Exam
            </button>
          </div>
        )}
      </div>
    );
  }

  const objScore = navItems
    .filter(n => n.type !== 'secC')
    .reduce((sum, n) => sum + (examAttempts[n.question.id]?.isCorrect ? 2 : 0), 0);
  const secCScore = activePaper.secC.reduce(
    (sum, q) => sum + (examAttempts[q.id]?.selfScore ?? 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Focused CBE Exam Header Toolbar */}
      <div className="bg-slate-900 text-white rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold truncate max-w-[320px] sm:max-w-none">
            {activePaper.title}
          </span>
          <span className="text-xs font-mono tabular-nums text-slate-300">
            Item {cursor + 1} / {navItems.length} ({currentItem.label})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 text-xs font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{submitted ? 'Exam Ended' : formatTimer(secondsLeft)}</span>
          </div>

          <button
            type="button"
            onClick={onOpenFormulae}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Formulae</span>
          </button>
          <button
            type="button"
            onClick={onToggleCalc}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculator</span>
          </button>
          <button
            type="button"
            onClick={onToggleScratchpad}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded whitespace-nowrap shrink-0 cursor-pointer"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Scratchpad</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNavGrid(v => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Navigator</span>
          </button>

          {!submitted ? (
            !confirmEnd ? (
              <button
                type="button"
                onClick={() => setConfirmEnd(true)}
                className="px-3 py-1 text-xs font-semibold bg-[#B91C1C] hover:bg-[#991B1B] rounded whitespace-nowrap shrink-0 cursor-pointer"
              >
                Submit Exam
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleFinishExam}
                  className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 rounded cursor-pointer"
                >
                  Confirm Finish
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmEnd(false)}
                  className="px-2 py-1 text-xs bg-slate-700 rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStarted(false)}
                className="px-3 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
              >
                Mock Suite
              </button>
              <button
                type="button"
                onClick={onExitExam}
                className="px-3 py-1 text-xs font-semibold bg-white text-slate-900 rounded cursor-pointer"
              >
                Exit Review
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post-Exam Score Banner */}
      {submitted && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Exam Submitted · Debrief Mode Active</span>
            </div>
            <p className="text-xs text-slate-600">
              Sections A & B are auto-marked below. Navigate to the Section C items to complete your self-marking rubric (saved scores sync automatically).
            </p>
          </div>
          <div className="flex items-center gap-6 font-mono tabular-nums text-sm">
            <div>
              <div className="text-xs text-slate-500">Objective (Sec A+B)</div>
              <div className="font-bold text-slate-900">
                {objScore} / {objectiveTotalMarks}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Section C Self-Mark</div>
              <div className="font-bold text-slate-900">
                {secCScore} / {sectionCTotalMarks}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Combined Total</div>
              <div
                className={`font-bold ${
                  objScore + secCScore >= (objectiveTotalMarks + sectionCTotalMarks) * 0.5
                    ? 'text-emerald-700'
                    : 'text-[#B91C1C]'
                }`}
              >
                {objScore + secCScore} / {objectiveTotalMarks + sectionCTotalMarks}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Navigator Grid */}
      {showNavGrid && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">
              Question Navigator (All {navItems.length} Items)
            </span>
            <span>Green = Attempted · Amber = Flagged · Dark = Current</span>
          </div>
          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
            {navItems.map((item, i) => {
              const id = item.question.id;
              const isCurr = i === cursor;
              const isFlag = examFlags.includes(id);
              const ans = examAttempts[id]?.answer;
              const hasObjAns =
                typeof ans === 'object' && ans !== null
                  ? Array.isArray(ans)
                    ? ans.length > 0
                    : Object.keys(ans).length > 0
                  : Boolean(ans);
              const isAttempted = Boolean(
                hasObjAns ||
                  examAttempts[id]?.wordText ||
                  Object.keys(examAttempts[id]?.sheetData || {}).length > 0
              );
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setCursor(i);
                    setShowNavGrid(false);
                  }}
                  className={`py-1.5 px-1 rounded text-xs font-mono font-medium border cursor-pointer relative ${
                    isCurr
                      ? 'bg-slate-900 text-white border-slate-900'
                      : isAttempted
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                  {isFlag && (
                    <Flag className="w-2.5 h-2.5 text-amber-600 absolute top-0.5 right-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Question Content */}
      {currentItem.type === 'secA' && (
        <OtQuestionCard
          key={currentItem.question.id}
          question={currentItem.question}
          prefixLabel={`Section A · Question ${currentItem.idx + 1}`}
          attempt={examAttempts[currentId]}
          isFlagged={examFlags.includes(currentId)}
          examMode={!submitted}
          onToggleFlag={() => toggleFlag(currentId)}
          onAnswer={ans => recordOt(currentId, currentItem.question, ans)}
        />
      )}

      {currentItem.type === 'secB' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-3 lg:sticky lg:top-4 lg:max-h-[760px] lg:overflow-y-auto">
            <p className="text-xs font-mono text-slate-500">
              Section B · Case Study: {currentItem.caseTitle}
            </p>
            {currentItem.hasDiagram && (currentItem.diagramPage || currentItem.pdfQuestionPage) && (
              <PdfPageViewer
                page={currentItem.diagramPage || currentItem.pdfQuestionPage!}
                compact
                label={`${currentItem.caseTitle} Diagram Page`}
              />
            )}
            <StructuredContent text={currentItem.scenario} compact />
          </div>
          <div className="lg:col-span-7">
            <OtQuestionCard
              key={currentItem.question.id}
              question={currentItem.question}
              prefixLabel={`${currentItem.caseTitle} · Question ${currentItem.question.number}`}
              attempt={examAttempts[currentId]}
              isFlagged={examFlags.includes(currentId)}
              examMode={!submitted}
              onToggleFlag={() => toggleFlag(currentId)}
              onAnswer={ans => recordOt(currentId, currentItem.question, ans)}
            />
          </div>
        </div>
      )}

      {currentItem.type === 'secC' && (
        <SectionCWorkspace
          key={currentItem.question.id}
          question={currentItem.question}
          attempt={examAttempts[currentId]}
          isFlagged={examFlags.includes(currentId)}
          examMode={!submitted}
          onToggleFlag={() => toggleFlag(currentId)}
          onUpdateDraft={patch => updateCrq(currentId, patch)}
        />
      )}

      {/* Bottom Prev / Next Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setCursor(c => Math.max(0, c - 1))}
          disabled={cursor === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Item</span>
        </button>

        <button
          type="button"
          onClick={() => setCursor(c => Math.min(navItems.length - 1, c + 1))}
          disabled={cursor >= navItems.length - 1}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
        >
          <span>Next Item</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
