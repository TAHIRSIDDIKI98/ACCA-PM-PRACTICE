import React, { useMemo, useState } from 'react';
import flashcardsData from '../../data/flashcards.json';
import syllabusTopics from '../../data/syllabusTopics.json';
import { FlashcardItem, SyllabusTopic } from '../../types/pm';
import { RotateCw, ChevronLeft, ChevronRight, Shuffle, CheckCircle2, BookOpen } from 'lucide-react';

interface FlashcardsViewProps {
  mastery: Record<string, 'learning' | 'mastered'>;
  onSetMastery: (cardId: string, status: 'learning' | 'mastered') => void;
}

export function FlashcardsView({ mastery, onSetMastery }: FlashcardsViewProps) {
  const cards = flashcardsData as FlashcardItem[];
  const topics = syllabusTopics as SyllabusTopic[];

  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'learning' | 'mastered'>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [shuffledOrder, setShuffledOrder] = useState<number[] | null>(null);

  const filteredCards = useMemo(() => {
    const base = cards.filter(c => {
      if (topicFilter !== 'all' && c.topicId !== topicFilter) return false;
      const status = mastery[c.id] || 'learning';
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      return true;
    });
    if (!shuffledOrder) return base;
    return shuffledOrder.map(i => base[i]).filter(Boolean);
  }, [cards, topicFilter, statusFilter, mastery, shuffledOrder]);

  const safeIndex = filteredCards.length ? Math.min(currentIndex, filteredCards.length - 1) : 0;
  const activeCard = filteredCards[safeIndex];

  const handleShuffle = () => {
    const indices = filteredCards.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledOrder(indices);
    setCurrentIndex(0);
    setFlipped(false);
  };

  const masteredCount = cards.filter(c => mastery[c.id] === 'mastered').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Active-Recall Flashcards</h1>
          <p className="text-sm text-slate-600 mt-1">
            Core ACCA Performance Management definitions, formulas, variance rules, and evaluation frameworks.
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-600">
          {masteredCount} / {cards.length} Mastered
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={topicFilter}
            onChange={e => {
              setTopicFilter(e.target.value);
              setCurrentIndex(0);
              setFlipped(false);
              setShuffledOrder(null);
            }}
            aria-label="Filter flashcards by syllabus topic"
            className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="all">All Syllabus Areas ({cards.length})</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>
                {t.code}. {t.shortTitle}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
            {(['all', 'learning', 'mastered'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatusFilter(s);
                  setCurrentIndex(0);
                  setFlipped(false);
                  setShuffledOrder(null);
                }}
                className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {s === 'all' ? 'All' : s === 'learning' ? 'Still Learning' : 'Mastered'}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleShuffle}
          disabled={filteredCards.length < 2}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Shuffle</span>
        </button>
      </div>

      {/* Card Stage */}
      {!activeCard ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
          <p className="text-sm font-medium text-slate-800">No flashcards match this filter.</p>
          <button
            type="button"
            onClick={() => {
              setTopicFilter('all');
              setStatusFilter('all');
            }}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            onClick={() => setFlipped(f => !f)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setFlipped(f => !f);
              }
            }}
            className="bg-white border border-slate-200 rounded-lg p-8 min-h-[280px] flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {topics.find(t => t.id === activeCard.topicId)?.title || 'Performance Management'}
              </span>
              <span className="font-mono tabular-nums">
                Card {safeIndex + 1} / {filteredCards.length} · {flipped ? 'Answer' : 'Prompt'}
              </span>
            </div>

            <div className="py-8 text-center">
              {!flipped ? (
                <h2 className="text-xl lg:text-2xl font-semibold text-slate-900 max-w-2xl mx-auto">
                  {activeCard.front}
                </h2>
              ) : (
                <div className="text-left max-w-2xl mx-auto space-y-2 text-[15px] leading-relaxed text-slate-800 whitespace-pre-line">
                  {activeCard.back}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
              <span className="inline-flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Click card or press Space to flip</span>
              </span>
              <span className="font-medium text-slate-700">
                Status: {mastery[activeCard.id] === 'mastered' ? 'Mastered' : 'Still Learning'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(i => Math.max(0, i - 1));
                  setFlipped(false);
                }}
                disabled={safeIndex === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(i => Math.min(filteredCards.length - 1, i + 1));
                  setFlipped(false);
                }}
                disabled={safeIndex >= filteredCards.length - 1}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSetMastery(activeCard.id, 'learning');
                  if (safeIndex < filteredCards.length - 1) {
                    setCurrentIndex(i => i + 1);
                    setFlipped(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Still Learning</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetMastery(activeCard.id, 'mastered');
                  if (safeIndex < filteredCards.length - 1) {
                    setCurrentIndex(i => i + 1);
                    setFlipped(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Mastered</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
