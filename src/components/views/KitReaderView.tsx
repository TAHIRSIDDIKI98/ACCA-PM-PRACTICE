import React, { useMemo, useState } from 'react';
import sectionA from '../../data/sectionA.json';
import sectionB from '../../data/sectionB.json';
import sectionC from '../../data/sectionC.json';
import specimenExam from '../../data/specimenExam.json';
import { OTQuestion, SectionBCase, SectionCQuestion } from '../../types/pm';
import { PdfPageViewer } from '../tools/PdfPageViewer';
import { Search } from 'lucide-react';

interface KitReaderViewProps {
  initialPage?: number;
  onJumpToQuestion?: (section: 'A' | 'B' | 'C', number: number) => void;
}

const BOOKMARKS = [
  { label: 'Cover & Contents', page: 4 },
  { label: 'Index to Q&As', page: 8 },
  { label: 'Past Exam Analysis', page: 12 },
  { label: 'Exam Technique', page: 13 },
  { label: 'Revision Plan', page: 20 },
  { label: 'Formulae Sheet', page: 29 },
  { label: 'Sec A Questions', page: 30 },
  { label: 'Sec B Cases', page: 112 },
  { label: 'Sec C Questions', page: 178 },
  { label: 'Sec A Answers', page: 244 },
  { label: 'Sec B Answers', page: 296 },
  { label: 'Sec C Answers', page: 346 },
  { label: 'Specimen Exam', page: 458 },
];

export function KitReaderView({ initialPage = 30, onJumpToQuestion }: KitReaderViewProps) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [query, setQuery] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'A' | 'B' | 'C' | 'Spec'>('all');

  const secA = sectionA as OTQuestion[];
  const secB = sectionB as SectionBCase[];
  const secC = sectionC as SectionCQuestion[];

  const masterIndex = useMemo(() => {
    const items: Array<{
      id: string;
      section: 'A' | 'B' | 'C' | 'Spec';
      number: number;
      title: string;
      topic: string;
      qPage: number;
      aPage: number;
    }> = [];

    secA.forEach(q => {
      items.push({
        id: q.id,
        section: 'A',
        number: q.number,
        title: `Q${q.number}: ${q.prompt.slice(0, 72)}…`,
        topic: q.subtopic || q.topicTitle || 'Section A',
        qPage: q.pdfQuestionPage,
        aPage: q.pdfAnswerPage,
      });
    });

    secB.forEach(c => {
      items.push({
        id: c.id,
        section: 'B',
        number: c.number,
        title: `Q${c.number}: ${c.title}${c.sitting ? ` (${c.sitting})` : ''}`,
        topic: c.topicTitle,
        qPage: c.pdfQuestionPage,
        aPage: c.pdfAnswerPage,
      });
    });

    secC.forEach(c => {
      items.push({
        id: c.id,
        section: 'C',
        number: c.number,
        title: `Q${c.number}: ${c.title}${c.sitting ? ` (${c.sitting})` : ''}`,
        topic: c.topicTitle,
        qPage: c.pdfQuestionPage,
        aPage: c.pdfAnswerPage,
      });
    });

    specimenExam.sectionA.forEach(q => {
      items.push({
        id: q.id,
        section: 'Spec',
        number: q.number,
        title: `Specimen Q${q.number}: ${q.prompt.slice(0, 68)}…`,
        topic: 'Specimen Section A',
        qPage: q.pdfQuestionPage,
        aPage: q.pdfAnswerPage,
      });
    });

    specimenExam.sectionB.forEach(c => {
      items.push({
        id: c.id,
        section: 'Spec',
        number: c.subQuestions[0]?.number || 16,
        title: `Specimen Sec B: ${c.title}`,
        topic: 'Specimen Section B Case',
        qPage: c.pdfQuestionPage,
        aPage: c.pdfAnswerPage,
      });
    });

    specimenExam.sectionC.forEach(c => {
      items.push({
        id: c.id,
        section: 'Spec',
        number: c.number,
        title: `Specimen Q${c.number}: ${c.title}`,
        topic: 'Specimen Section C CRQ',
        qPage: c.pdfQuestionPage,
        aPage: c.pdfAnswerPage,
      });
    });

    return items;
  }, [secA, secB, secC]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return masterIndex.filter(item => {
      if (sectionFilter !== 'all' && item.section !== sectionFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        String(item.number) === q
      );
    });
  }, [masterIndex, sectionFilter, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kaplan 2026 Exam Kit PDF Reader & Complete Master Index
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Direct page-synced access to all 488 pages, 309 Kit questions, and 32 Specimen Exam questions.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {BOOKMARKS.map(b => (
            <button
              key={b.label}
              type="button"
              onClick={() => setCurrentPage(b.page)}
              className={`px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap shrink-0 cursor-pointer ${
                currentPage === b.page
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Index (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col max-h-[780px]">
          <div className="p-3 border-b border-slate-200 space-y-2.5 bg-slate-50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search question #, company, or topic..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#0369A1]"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-md">
              {(['all', 'A', 'B', 'C', 'Spec'] as const).map(sec => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSectionFilter(sec)}
                  className={`flex-1 py-1 text-xs font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
                    sectionFilter === sec ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {sec === 'all' ? 'All' : sec === 'Spec' ? 'Specimen' : `Sec ${sec}`}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100">
            {filtered.map(item => (
              <div key={item.id} className="p-3 hover:bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-500">
                    {item.section === 'Spec' ? 'Specimen Exam' : `Section ${item.section}`} · {item.topic}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-900 line-clamp-2">{item.title}</p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(item.qPage)}
                    className="px-2 py-1 text-[11px] font-mono font-medium bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Question p.{item.qPage}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(item.aPage)}
                    className="px-2 py-1 text-[11px] font-mono font-medium bg-white border border-slate-200 rounded text-[#0369A1] hover:bg-sky-50 cursor-pointer"
                  >
                    Answer p.{item.aPage}
                  </button>
                  {onJumpToQuestion && item.section !== 'Spec' && (
                    <button
                      type="button"
                      onClick={() =>
                        onJumpToQuestion(item.section as 'A' | 'B' | 'C', item.number)
                      }
                      className="px-2 py-1 text-[11px] font-medium text-[#B91C1C] hover:underline cursor-pointer"
                    >
                      Practice Interactive →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right PDF Canvas Viewer (7 cols) */}
        <div className="lg:col-span-7">
          <PdfPageViewer page={currentPage} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
}
