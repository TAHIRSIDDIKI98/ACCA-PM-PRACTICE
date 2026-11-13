import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, FileText } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const PDF_URL = '/assets/aistudio/PM_Kaplan_Kit_2026_261113_175919_794d93a1.pdf';

let cachedPdfPromise: Promise<pdfjsLib.PDFDocumentProxy> | null = null;
function getPdfDocument() {
  if (!cachedPdfPromise) {
    cachedPdfPromise = pdfjsLib.getDocument({ url: PDF_URL }).promise;
  }
  return cachedPdfPromise;
}

interface PdfPageViewerProps {
  page: number;
  onPageChange?: (nextPage: number) => void;
  compact?: boolean;
  label?: string;
}

export function PdfPageViewer({ page, onPageChange, compact = false, label }: PdfPageViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [totalPages, setTotalPages] = useState<number>(488);
  const [scale, setScale] = useState<number>(compact ? 1.0 : 1.15);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [jumpInput, setJumpInput] = useState<string>(String(page));

  useEffect(() => {
    setJumpInput(String(page));
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;

    async function render() {
      setLoading(true);
      setError('');
      try {
        const doc = await getPdfDocument();
        if (cancelled) return;
        setTotalPages(doc.numPages);

        const safePage = Math.max(1, Math.min(doc.numPages, page));
        const pdfPage = await doc.getPage(safePage);
        if (cancelled) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderTask = pdfPage.render({ canvasContext: ctx, viewport, canvas });
        await renderTask.promise;
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled && (err as { name?: string })?.name !== 'RenderingCancelledException') {
          setError('Unable to load this page from the Kaplan Exam Kit PDF.');
          setLoading(false);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [page, scale]);

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpInput, 10);
    if (!Number.isNaN(num) && onPageChange) {
      onPageChange(Math.max(1, Math.min(totalPages, num)));
    }
  };

  return (
    <div className="flex flex-col border border-slate-200 rounded-lg bg-white overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <FileText className="w-4 h-4 text-slate-500" />
          <span>{label || 'Kaplan PM 2026 Exam Kit'}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-slate-600">
            PDF p.{page} / {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onPageChange && (
            <>
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                aria-label="Previous PDF page"
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <form onSubmit={handleJump} className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={jumpInput}
                  onChange={e => setJumpInput(e.target.value)}
                  aria-label="PDF page number"
                  className="w-12 px-1.5 py-1 text-xs font-mono tabular-nums text-center border border-slate-200 rounded bg-white text-slate-900"
                />
                <button
                  type="submit"
                  className="px-2 py-1 text-xs font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Go
                </button>
              </form>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                aria-label="Next PDF page"
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={() => setScale(s => Math.max(0.65, +(s - 0.15).toFixed(2)))}
            aria-label="Zoom out PDF"
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono tabular-nums text-slate-600 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale(s => Math.min(2.0, +(s + 0.15).toFixed(2)))}
            aria-label="Zoom in PDF"
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className={`relative overflow-auto bg-slate-100 flex justify-center p-4 ${compact ? 'max-h-[480px]' : 'max-h-[760px]'}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-10">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-md border border-slate-200">
              <Loader2 className="w-4 h-4 animate-spin text-[#0369A1]" />
              <span>Rendering page {page}…</span>
            </div>
          </div>
        )}
        {error ? (
          <div className="py-12 text-center text-sm text-rose-700">{error}</div>
        ) : (
          <canvas ref={canvasRef} className="shadow-sm bg-white border border-slate-200" />
        )}
      </div>
    </div>
  );
}
