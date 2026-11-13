import React, { useState } from 'react';
import recentPreMocks from '../../data/recentPreMocks.json';
import { PreMockCase, SpreadsheetData, StudyStoreState } from '../../types/pm';
import { SectionCWorkspace } from '../practice/SectionCWorkspace';
import { ArrowRight, BookMarked, Calculator, StickyNote } from 'lucide-react';

interface PreMockViewProps {
  store: StudyStoreState;
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
  onOpenKitQuestion: (section: 'B' | 'C', number: number) => void;
  onOpenFormulae: () => void;
  onToggleCalc: () => void;
  onToggleScratchpad: () => void;
}

export function PreMockView({
  store,
  onUpdateCrqDraft,
  onToggleFlag,
  onOpenKitQuestion,
  onOpenFormulae,
  onToggleCalc,
  onToggleScratchpad,
}: PreMockViewProps) {
  const cases = recentPreMocks.preMockCases as PreMockCase[];
  const [selectedId, setSelectedId] = useState<string>(cases[0].id);

  const activeCase = cases.find(c => c.id === selectedId) || cases[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">
              Official Practice Platform Releases & Recent Sittings · 2024 – 2026
            </p>
            <h1 className="text-2xl font-bold text-slate-900">{recentPreMocks.title}</h1>
            <p className="text-sm text-slate-600">{recentPreMocks.subtitle}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
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

        {/* 2024 Recent Kit Sittings Quick Strip */}
        <div className="pt-4 border-t border-slate-200 space-y-2">
          <p className="text-xs font-semibold text-slate-700">
            2024 Published Exam Sittings (Included Verbatim in Kaplan Kit Bank):
          </p>
          <div className="flex flex-wrap gap-2">
            {recentPreMocks.kitRecentReferences.map(ref => (
              <button
                key={ref.kitNumber}
                type="button"
                onClick={() =>
                  onOpenKitQuestion(ref.kitNumber <= 263 ? 'B' : 'C', ref.kitNumber)
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>
                  Q{ref.kitNumber} · {ref.title} ({ref.sitting})
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selector for 2025-2026 Pre-Mock & Published Exam Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {cases.map(item => {
          const isActive = item.id === activeCase.id;
          const attempt = store.attempts[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`text-left p-4 rounded-lg border transition-colors cursor-pointer space-y-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div
                className={`text-[11px] font-mono ${
                  isActive ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {item.sitting} · {item.totalMarks} Marks
              </div>
              <div className="text-sm font-semibold">{item.title}</div>
              <div className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-600'}`}>
                {item.topicTitle}
              </div>
              {attempt?.selfScore !== undefined && (
                <div
                  className={`text-[11px] font-mono tabular-nums pt-1 ${
                    isActive ? 'text-emerald-300' : 'text-emerald-700'
                  }`}
                >
                  Self-marked: {attempt.selfScore}/{item.totalMarks}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Pre-Mock Case Workspace */}
      <SectionCWorkspace
        key={activeCase.id}
        question={activeCase}
        attempt={store.attempts[activeCase.id]}
        isFlagged={store.flagged.includes(activeCase.id)}
        onToggleFlag={() => onToggleFlag(activeCase.id)}
        onUpdateDraft={patch => onUpdateCrqDraft(activeCase.id, patch)}
      />
    </div>
  );
}
