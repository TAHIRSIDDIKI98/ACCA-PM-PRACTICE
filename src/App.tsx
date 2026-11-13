import React, { useState } from 'react';
import { AppView } from './types/pm';
import { useStudyStore } from './store/useStudyStore';
import { DashboardView } from './components/views/DashboardView';
import { PracticeBankView } from './components/views/PracticeBankView';
import { PreMockView } from './components/views/PreMockView';
import { FlashcardsView } from './components/views/FlashcardsView';
import { KitReaderView } from './components/views/KitReaderView';
import { MockExamView } from './components/views/MockExamView';
import { FormulaeModal } from './components/tools/FormulaeModal';
import { ScientificCalculator } from './components/tools/ScientificCalculator';
import { ScratchpadModal } from './components/tools/ScratchpadModal';

export default function App() {
  const {
    state,
    recordAttempt,
    updateCrqDraft,
    toggleFlag,
    setTopicConfidence,
    setCardMastery,
    setScratchpad,
    saveMockRun,
    exportJson,
    importJson,
    resetAll,
  } = useStudyStore();

  const [view, setView] = useState<AppView>('syllabus');
  const [bankSection, setBankSection] = useState<'A' | 'B' | 'C'>('A');
  const [bankTopic, setBankTopic] = useState<string>('all');
  const [bankQNum, setBankQNum] = useState<number | null>(null);
  const [readerPage, setReaderPage] = useState<number>(30);

  const [showFormulae, setShowFormulae] = useState<boolean>(false);
  const [showCalc, setShowCalc] = useState<boolean>(false);
  const [showScratchpad, setShowScratchpad] = useState<boolean>(false);

  const handlePracticeTopic = (topicId: string, sec: 'A' | 'B' | 'C' = 'A') => {
    setBankTopic(topicId);
    setBankSection(sec);
    setBankQNum(null);
    setView('bank');
  };

  const handleJumpToQuestion = (sec: 'A' | 'B' | 'C', num: number) => {
    setBankTopic('all');
    setBankSection(sec);
    setBankQNum(num);
    setView('bank');
  };

  const handleOpenKitPage = (page: number) => {
    setReaderPage(page);
    setView('reader');
  };

  const navItems: Array<{ id: AppView; label: string }> = [
    { id: 'syllabus', label: 'Syllabus' },
    { id: 'bank', label: 'Question Bank' },
    { id: 'premocks', label: 'Pre-Mocks' },
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'reader', label: 'Kit Reader' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element brand wordmark */}
          <button
            type="button"
            onClick={() => setView('syllabus')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            PM Study Hub
          </button>

          {/* Zone 2: Clean single-line typography navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.map(item => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                    active
                      ? 'text-slate-900 border-[#B91C1C] font-semibold'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setView('mock')}
              className="px-4 py-2 text-xs font-semibold bg-[#B91C1C] text-white rounded-lg hover:bg-[#991B1B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Launch CBE Mock
            </button>
          </div>
        </div>

        {/* Mobile Secondary Nav */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium text-slate-600">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`whitespace-nowrap shrink-0 py-1 ${
                view === item.id ? 'text-[#B91C1C] font-semibold' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
        {view === 'syllabus' && (
          <DashboardView
            store={state}
            onNavigate={setView}
            onPracticeTopic={handlePracticeTopic}
            onSetConfidence={setTopicConfidence}
            onExportJson={exportJson}
            onImportJson={importJson}
            onResetAll={resetAll}
          />
        )}

        {view === 'bank' && (
          <PracticeBankView
            store={state}
            initialSection={bankSection}
            initialTopicId={bankTopic}
            initialQuestionNumber={bankQNum}
            onRecordAttempt={(qId, ans, ok, sub) =>
              recordAttempt({
                questionId: qId,
                answer: ans,
                isCorrect: ok,
                submitted: sub,
                updatedAt: Date.now(),
              })
            }
            onUpdateCrqDraft={updateCrqDraft}
            onToggleFlag={toggleFlag}
            onOpenKitPage={handleOpenKitPage}
            onOpenFormulae={() => setShowFormulae(true)}
            onToggleCalc={() => setShowCalc(v => !v)}
            onToggleScratchpad={() => setShowScratchpad(v => !v)}
          />
        )}

        {view === 'premocks' && (
          <PreMockView
            store={state}
            onUpdateCrqDraft={updateCrqDraft}
            onToggleFlag={toggleFlag}
            onOpenKitQuestion={(sec, num) => handleJumpToQuestion(sec, num)}
            onOpenFormulae={() => setShowFormulae(true)}
            onToggleCalc={() => setShowCalc(v => !v)}
            onToggleScratchpad={() => setShowScratchpad(v => !v)}
          />
        )}

        {view === 'flashcards' && (
          <FlashcardsView mastery={state.flashcardMastery} onSetMastery={setCardMastery} />
        )}

        {view === 'reader' && (
          <KitReaderView
            initialPage={readerPage}
            onJumpToQuestion={(sec, num) => handleJumpToQuestion(sec, num)}
          />
        )}

        {view === 'mock' && (
          <MockExamView
            store={state}
            onExitExam={() => setView('syllabus')}
            onSaveMockRun={saveMockRun}
            onOpenFormulae={() => setShowFormulae(true)}
            onToggleCalc={() => setShowCalc(v => !v)}
            onToggleScratchpad={() => setShowScratchpad(v => !v)}
          />
        )}
      </main>

      {/* Floating CBE Overlays */}
      {showFormulae && <FormulaeModal onClose={() => setShowFormulae(false)} />}
      {showCalc && <ScientificCalculator onClose={() => setShowCalc(false)} />}
      {showScratchpad && (
        <ScratchpadModal
          value={state.scratchpad}
          onChange={setScratchpad}
          onClose={() => setShowScratchpad(false)}
        />
      )}
    </div>
  );
}
