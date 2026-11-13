import { useState, useEffect, useCallback } from 'react';
import {
  AttemptRecord,
  ConfidenceLevel,
  MockRunRecord,
  SpreadsheetData,
  StudyStoreState,
} from '../types/pm';

const STORAGE_KEY = 'pm_study_hub_state_v1';

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return getLocalDateKey(dt);
}

function appendTodayActivity(dates: string[]): string[] {
  const today = getLocalDateKey();
  if (dates.includes(today)) return dates;
  return [...dates, today].sort();
}

export function computeStudyStreak(activityDates: string[]): {
  currentStreak: number;
  longestStreak: number;
  studiedToday: boolean;
  totalActiveDays: number;
} {
  const uniqueSorted = Array.from(new Set(activityDates)).sort();
  if (uniqueSorted.length === 0) {
    return { currentStreak: 0, longestStreak: 0, studiedToday: false, totalActiveDays: 0 };
  }

  const dateSet = new Set(uniqueSorted);
  const today = getLocalDateKey();
  const yesterday = shiftDateKey(today, -1);
  const studiedToday = dateSet.has(today);

  let currentStreak = 0;
  let cursor = studiedToday ? today : dateSet.has(yesterday) ? yesterday : '';
  while (cursor && dateSet.has(cursor)) {
    currentStreak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < uniqueSorted.length; i++) {
    if (shiftDateKey(uniqueSorted[i - 1], 1) === uniqueSorted[i]) {
      run += 1;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
    studiedToday,
    totalActiveDays: uniqueSorted.length,
  };
}

const DEFAULT_STATE: StudyStoreState = {
  attempts: {},
  flagged: [],
  confidence: {},
  flashcardMastery: {},
  scratchpad: '',
  mockHistory: [],
  activityDates: [],
};

function loadInitialState(): StudyStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<StudyStoreState>;
    return {
      attempts: parsed.attempts ?? {},
      flagged: Array.isArray(parsed.flagged) ? parsed.flagged : [],
      confidence: parsed.confidence ?? {},
      flashcardMastery: parsed.flashcardMastery ?? {},
      scratchpad: typeof parsed.scratchpad === 'string' ? parsed.scratchpad : '',
      mockHistory: Array.isArray(parsed.mockHistory) ? parsed.mockHistory : [],
      activityDates: Array.isArray(parsed.activityDates) ? parsed.activityDates : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useStudyStore() {
  const [state, setState] = useState<StudyStoreState>(loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const recordAttempt = useCallback((record: AttemptRecord) => {
    setState(prev => ({
      ...prev,
      attempts: {
        ...prev.attempts,
        [record.questionId]: record,
      },
      activityDates: record.submitted ? appendTodayActivity(prev.activityDates) : prev.activityDates,
    }));
  }, []);

  const updateCrqDraft = useCallback(
    (
      questionId: string,
      patch: Partial<{
        sheetData: SpreadsheetData;
        wordText: string;
        rubricChecks: number[];
        selfScore: number;
        submitted: boolean;
      }>
    ) => {
      setState(prev => {
        const existing = prev.attempts[questionId] ?? {
          questionId,
          answer: '',
          submitted: false,
          updatedAt: Date.now(),
        };
        return {
          ...prev,
          attempts: {
            ...prev.attempts,
            [questionId]: {
              ...existing,
              ...patch,
              updatedAt: Date.now(),
            },
          },
          activityDates: appendTodayActivity(prev.activityDates),
        };
      });
    },
    []
  );

  const toggleFlag = useCallback((questionId: string) => {
    setState(prev => {
      const exists = prev.flagged.includes(questionId);
      return {
        ...prev,
        flagged: exists
          ? prev.flagged.filter(id => id !== questionId)
          : [...prev.flagged, questionId],
      };
    });
  }, []);

  const setTopicConfidence = useCallback((topicId: string, level: ConfidenceLevel) => {
    setState(prev => ({
      ...prev,
      confidence: { ...prev.confidence, [topicId]: level },
      activityDates: appendTodayActivity(prev.activityDates),
    }));
  }, []);

  const setCardMastery = useCallback((cardId: string, status: 'learning' | 'mastered') => {
    setState(prev => ({
      ...prev,
      flashcardMastery: { ...prev.flashcardMastery, [cardId]: status },
      activityDates: appendTodayActivity(prev.activityDates),
    }));
  }, []);

  const setScratchpad = useCallback((text: string) => {
    setState(prev => ({ ...prev, scratchpad: text }));
  }, []);

  const saveMockRun = useCallback((run: MockRunRecord) => {
    setState(prev => {
      const idx = prev.mockHistory.findIndex(r => r.id === run.id);
      const nextHistory =
        idx >= 0
          ? prev.mockHistory.map((r, i) => (i === idx ? run : r))
          : [run, ...prev.mockHistory].slice(0, 20);
      return {
        ...prev,
        mockHistory: nextHistory,
        activityDates: appendTodayActivity(prev.activityDates),
      };
    });
  }, []);

  const recordStudyActivity = useCallback(() => {
    setState(prev => ({
      ...prev,
      activityDates: appendTodayActivity(prev.activityDates),
    }));
  }, []);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pm-study-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importJson = useCallback((jsonText: string): { ok: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonText) as Partial<StudyStoreState>;
      if (!parsed || typeof parsed !== 'object' || !parsed.attempts) {
        return { ok: false, message: 'Invalid backup structure.' };
      }
      setState({
        attempts: parsed.attempts ?? {},
        flagged: Array.isArray(parsed.flagged) ? parsed.flagged : [],
        confidence: parsed.confidence ?? {},
        flashcardMastery: parsed.flashcardMastery ?? {},
        scratchpad: typeof parsed.scratchpad === 'string' ? parsed.scratchpad : '',
        mockHistory: Array.isArray(parsed.mockHistory) ? parsed.mockHistory : [],
        activityDates: Array.isArray(parsed.activityDates) ? parsed.activityDates : [],
      });
      return { ok: true, message: 'Study progress restored successfully.' };
    } catch {
      return { ok: false, message: 'Could not parse JSON file.' };
    }
  }, []);

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const streak = computeStudyStreak(state.activityDates);

  return {
    state,
    topicConfidence: state.confidence,
    streak,
    recordAttempt,
    updateCrqDraft,
    toggleFlag,
    setTopicConfidence,
    setCardMastery,
    setScratchpad,
    saveMockRun,
    recordStudyActivity,
    exportJson,
    importJson,
    resetAll,
  };
}
