import React from 'react';
import { X } from 'lucide-react';

export function FormulaeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Official ACCA PM Formulae Sheet & Quick Reference
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Formulae Sheet"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-sm text-slate-800">
          <section className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Exam-Provided Formulae (Regression, Learning Curve, Demand)
            </h4>
            <div className="grid gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <p className="font-semibold text-slate-900 mb-1.5">Regression Analysis</p>
                <div className="font-mono text-[13px] space-y-1 text-slate-800">
                  <p>y = a + bx</p>
                  <p>a = (Σy / n) − b(Σx / n)</p>
                  <p>b = (nΣxy − ΣxΣy) / (nΣx² − (Σx)²)</p>
                  <p>r = (nΣxy − ΣxΣy) / √[(nΣx² − (Σx)²)(nΣy² − (Σy)²)]</p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <p className="font-semibold text-slate-900 mb-1.5">Learning Curve</p>
                <div className="font-mono text-[13px] space-y-1 text-slate-800">
                  <p>Y = axᵇ</p>
                  <p className="text-xs text-slate-600 font-sans">
                    where Y = cumulative average time per unit to produce x units; a = time for first unit; x = cumulative units; b = log(learning rate) / log(2)
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <p className="font-semibold text-slate-900 mb-1.5">Demand Curve & Pricing</p>
                <div className="font-mono text-[13px] space-y-1 text-slate-800">
                  <p>P = a − bQ</p>
                  <p>b = Change in Price / Change in Quantity</p>
                  <p>a = Price when Q = 0</p>
                  <p>MR = a − 2bQ</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Core Non-Provided PM Equations (Memorise)
            </h4>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 text-[13px]">
              <div className="p-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-medium text-slate-900">Throughput Accounting Ratio (TPAR)</span>
                <span className="font-mono text-slate-700">(Return / Bottleneck hr) ÷ (Factory Cost / Bottleneck hr)</span>
              </div>
              <div className="p-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-medium text-slate-900">Weighted Avg C/S Ratio</span>
                <span className="font-mono text-slate-700">Total Contribution ÷ Total Sales Revenue</span>
              </div>
              <div className="p-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-medium text-slate-900">Margin of Safety (%)</span>
                <span className="font-mono text-slate-700">(Budgeted Sales − Breakeven Sales) ÷ Budgeted Sales × 100</span>
              </div>
              <div className="p-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-medium text-slate-900">Return on Investment (ROI)</span>
                <span className="font-mono text-slate-700">Controllable Profit ÷ Capital Employed × 100%</span>
              </div>
              <div className="p-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-medium text-slate-900">Residual Income (RI)</span>
                <span className="font-mono text-slate-700">Controllable Profit − (Capital Employed × Cost of Capital)</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
