export type AppView =
  | 'syllabus'
  | 'bank'
  | 'premocks'
  | 'flashcards'
  | 'reader'
  | 'mock';

export type ConfidenceLevel = 'needs-review' | 'developing' | 'exam-ready';

export interface OptionItem {
  key: string;
  text: string;
}

export interface OTSubInput {
  id: string;
  label: string;
  prefix?: string;
  suffix?: string;
  correctAnswer: string;
}

export interface OTMatrixConfig {
  columns: string[];
  mode?: 'grid' | 'dropdown';
  rows: {
    id: string;
    prompt: string;
    correctColumn: string;
  }[];
}

export interface OTQuestion {
  id: string;
  number: number;
  topicId?: string;
  topicTitle?: string;
  subtopicId?: string;
  subtopic?: string;
  marks?: number;
  prompt: string;
  options: OptionItem[];
  questionType: 'single' | 'multi' | 'numeric' | 'matrix' | 'interactive';
  selectCount: number;
  correctAnswer: string | string[];
  answerKeyRaw: string;
  explanation: string;
  keyAnswerTip: string;
  tutorialNote: string;
  hasDiagram: boolean;
  hasDebrief?: boolean;
  pdfQuestionPage: number;
  pdfAnswerPage: number;
  diagramPage?: number;
  subInputs?: OTSubInput[];
  matrix?: OTMatrixConfig;
}

export interface SectionBCase {
  id: string;
  number: number;
  title: string;
  sitting: string;
  topicId: string;
  topicTitle: string;
  scenario: string;
  subQuestions: OTQuestion[];
  keyAnswerTip: string;
  tutorialNote: string;
  hasDiagram: boolean;
  hasDebrief?: boolean;
  pdfQuestionPage: number;
  pdfAnswerPage: number;
  diagramPage?: number;
}

export interface CRQRequirement {
  label: string;
  text: string;
  marks: number;
  tool: 'spreadsheet' | 'word' | 'both';
}

export interface MarkingCriterion {
  label: string;
  marks: number;
}

export interface SectionCQuestion {
  id: string;
  number: number;
  title: string;
  sitting: string;
  topicId: string;
  topicTitle: string;
  scenario: string;
  requirements: CRQRequirement[];
  rawRequired: string;
  totalMarks: number;
  modelAnswer: string;
  markingScheme: MarkingCriterion[];
  keyAnswerTip: string;
  tutorialNote: string;
  examinerComment: string;
  hasDiagram: boolean;
  hasDebrief?: boolean;
  pdfQuestionPage: number;
  pdfAnswerPage: number;
  diagramPage?: number;
}

export interface PreMockCase {
  id: string;
  section: 'B' | 'C';
  sitting: string;
  title: string;
  topicId: string;
  topicTitle: string;
  totalMarks: number;
  scenario: string;
  requirements: CRQRequirement[];
  markingScheme: MarkingCriterion[];
  modelAnswer: string;
  keyAnswerTip: string;
  examinerComment: string;
}

export interface SyllabusTopic {
  id: string;
  code: string;
  title: string;
  shortTitle: string;
  subtopics: {
    id: string;
    title: string;
    qStart: number;
    qEnd: number;
  }[];
}

export interface FlashcardItem {
  id: string;
  topicId: string;
  front: string;
  back: string;
}

export type SpreadsheetData = Record<string, string>;

export interface AttemptRecord {
  questionId: string;
  answer: string | string[] | Record<string, string>;
  isCorrect?: boolean;
  submitted: boolean;
  updatedAt: number;
  sheetData?: SpreadsheetData;
  wordText?: string;
  rubricChecks?: number[];
  selfScore?: number;
}

export interface CuratedMockExam {
  id: string;
  number: number;
  title: string;
  tier: string;
  focus: string;
  totalMarks: number;
  areaMarks: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
  };
  formatMix: {
    numeric: number;
    matrix: number;
    multi: number;
    single: number;
  };
  subtopicCount: number;
  subtopicsCovered: string[];
  secAIds: string[];
  secBIds: string[];
  secCIds: string[];
}

export interface MockRunRecord {
  id: string;
  mockId?: string;
  examTitle: string;
  completedAt: number;
  durationUsedSeconds: number;
  objectiveScore: number;
  objectiveTotal: number;
  sectionCSelfScore: number;
  sectionCTotal: number;
}

export interface StudyStoreState {
  attempts: Record<string, AttemptRecord>;
  flagged: string[];
  confidence: Record<string, ConfidenceLevel>;
  flashcardMastery: Record<string, 'learning' | 'mastered'>;
  scratchpad: string;
  mockHistory: MockRunRecord[];
  activityDates: string[];
}
