import React, { useState } from 'react';
import syllabusTopics from '../../data/syllabusTopics.json';
import { ConfidenceLevel, SyllabusTopic } from '../../types/pm';
import { ArrowRight } from 'lucide-react';

interface DashboardWidgetProps {
  topicConfidence: Record<string, ConfidenceLevel>;
  onSelectTopic?: (topicId: string) => void;
}

const CONFIDENCE_META: Record<
  ConfidenceLevel,
  { score: number; label: string; barClass: string; textClass: string }
> = {
  'needs-review': {
    score: 33,
    label: 'Needs Review',
    barClass: 'bg-amber-500',
    textClass: 'text-amber-800',
  },
  developing: {
    score: 67,
    label: 'Developing',
    barClass: 'bg-[#0369A1]',
    textClass: 'text-[#0369A1]',
  },
  'exam-ready': {
    score: 100,
    label: 'Exam Ready',
    barClass: 'bg-emerald-600',
    textClass: 'text-emerald-700',
  },
};

export function DashboardWidget({ topicConfidence, onSelectTopic }: DashboardWidgetProps) {
  const topics = syllabusTopics as SyllabusTopic[];
  const [chartMode, setChartMode] = useState<'radar' | 'bars'>('radar');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const items = topics.map(topic => {
    const level: ConfidenceLevel = topicConfidence[topic.id] || 'needs-review';
    const meta = CONFIDENCE_META[level];
    return {
      ...topic,
      level,
      ...meta,
    };
  });

  const overallScore = Math.round(
    items.reduce((sum, item) => sum + item.score, 0) / (items.length || 1)
  );
  const readyCount = items.filter(i => i.level === 'exam-ready').length;

  // Radar geometry (5 axes starting at top -90deg)
  const cx = 250;
  const cy = 156;
  const maxR = 80;
  const ringLevels = [33, 67, 100];

  const getPoint = (index: number, pct: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / items.length;
    const r = (pct / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const polygonPoints = items
    .map((item, idx) => {
      const pt = getPoint(idx, item.score);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-5 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Syllabus Proficiency Profile</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-700">
              {readyCount} / {items.length} Exam Ready ({overallScore}% readiness index)
            </span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Topic Confidence Overview
          </h2>
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
          <button
            type="button"
            onClick={() => setChartMode('radar')}
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
              chartMode === 'radar'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Radar Chart
          </button>
          <button
            type="button"
            onClick={() => setChartMode('bars')}
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap shrink-0 cursor-pointer ${
              chartMode === 'bars'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Progress Bars
          </button>
        </div>
      </div>

      {chartMode === 'radar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <svg
              viewBox="0 0 500 300"
              className="w-full max-w-[460px] h-auto"
              role="img"
              aria-label="Radar chart of syllabus proficiency across ACCA PM areas A to E"
            >
              {/* Concentric tier pentagons */}
              {ringLevels.map(ring => {
                const pts = items
                  .map((_, idx) => {
                    const p = getPoint(idx, ring);
                    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={ring}
                    points={pts}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth={ring === 100 ? 1.25 : 1}
                    strokeDasharray={ring === 100 ? undefined : '3 3'}
                  />
                );
              })}

              {/* Radial axis spokes */}
              {items.map((item, idx) => {
                const outer = getPoint(idx, 100);
                return (
                  <line
                    key={item.id}
                    x1={cx}
                    y1={cy}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="#CBD5E1"
                    strokeWidth={1}
                  />
                );
              })}

              {/* Proficiency polygon */}
              <polygon
                points={polygonPoints}
                fill="rgba(3, 105, 161, 0.16)"
                stroke="#0369A1"
                strokeWidth={2}
                strokeLinejoin="round"
              />

              {/* Data vertices & axis labels */}
              {items.map((item, idx) => {
                const pt = getPoint(idx, item.score);
                const labelPt = getPoint(idx, 120);
                const isHovered = hoveredId === item.id;
                const anchor =
                  Math.abs(labelPt.x - cx) < 12
                    ? 'middle'
                    : labelPt.x > cx
                    ? 'start'
                    : 'end';

                return (
                  <g
                    key={item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="cursor-pointer"
                    onClick={() => onSelectTopic && onSelectTopic(item.id)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4.5}
                      fill={item.level === 'exam-ready' ? '#059669' : item.level === 'developing' ? '#0369A1' : '#D97706'}
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                    <text
                      x={labelPt.x}
                      y={labelPt.y}
                      textAnchor={anchor}
                      dominantBaseline="middle"
                      className="text-[11px] font-semibold fill-slate-700"
                    >
                      {item.code}. {item.shortTitle}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="lg:col-span-7 divide-y divide-slate-200 border border-slate-200 rounded-lg">
            {items.map(item => {
              const isHovered = hoveredId === item.id;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`px-4 py-3 flex items-center justify-between gap-4 transition-colors ${
                    isHovered ? 'bg-slate-50' : 'bg-white'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-900 truncate">
                        {item.code}. {item.title}
                      </span>
                      <span className={`font-mono tabular-nums font-semibold shrink-0 ${item.textClass}`}>
                        {item.label} ({item.score}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${item.barClass}`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>

                  {onSelectTopic && (
                    <button
                      type="button"
                      onClick={() => onSelectTopic(item.id)}
                      aria-label={`Practice ${item.shortTitle}`}
                      className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shrink-0 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-900">
                  Syllabus Area {item.code} · {item.title}
                </span>
                <span className={`font-mono tabular-nums font-semibold ${item.textClass}`}>
                  {item.label} · {item.score}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${item.barClass}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
