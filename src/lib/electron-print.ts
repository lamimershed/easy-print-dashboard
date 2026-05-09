/**
 * Utilities for printing inside the Electron companion app.
 * When running in a browser the functions gracefully fall back to
 * the standard browser print dialog.
 */

import type { PrintResult, PrintStage } from '@/types/electron';

export type { PrintResult, PrintStage };

/** Returns true only when the page is loaded inside the Electron companion app. */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
}

// ── Print Configuration ────────────────────────────────────────────────────────

export interface PrintConfig {
  /** 'all', or a range string like '1-3' or '1,3,5' (1-indexed) */
  pageRange: 'all' | string;
  /** Pages to render per physical sheet (1 = normal, 2 = 2-up landscape, 4 = 4-up landscape) */
  pagesPerSheet: 1 | 2 | 4;
  /** Number of copies to print (1–20) */
  copies: number;
}

export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  pageRange: 'all',
  pagesPerSheet: 1,
  copies: 1,
};

// ── Page-splitting helpers (private) ──────────────────────────────────────────

function extractHeadStyles(html: string): string {
  const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return match ? match[1] : '';
}

function splitHtmlIntoPages(html: string): string[] {
  // Extract just the body content so we don't split on structural tags
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;

  // Split on <div class="break"> elements (multi-page test generator pattern)
  // and also on any div with an inline page-break-after:always style
  const segments = body
    .split(
      /<div\s+class=["']break["'][^>]*>[\s\S]*?<\/div>|<div[^>]+style=["'][^"']*page-break-after\s*:\s*always[^"']*["'][^>]*>[\s\S]*?<\/div>/gi
    )
    .map((p) => p.trim())
    .filter(Boolean);

  return segments.length > 0 ? segments : [body.trim()];
}

function parsePageRange(range: string, totalPages: number): number[] {
  if (range === 'all') return Array.from({ length: totalPages }, (_, i) => i);

  const indices: number[] = [];
  for (const part of range.split(',')) {
    const trimmed = part.trim();
    const dashMatch = trimmed.match(/^(\d+)-(\d+)$/);
    if (dashMatch) {
      const start = parseInt(dashMatch[1], 10) - 1;
      const end = parseInt(dashMatch[2], 10) - 1;
      for (let i = start; i <= end && i < totalPages; i++) {
        if (i >= 0) indices.push(i);
      }
    } else {
      const n = parseInt(trimmed, 10) - 1;
      if (!isNaN(n) && n >= 0 && n < totalPages) indices.push(n);
    }
  }
  return [...new Set(indices)].sort((a, b) => a - b);
}

/**
 * Wraps page content chunks in an N-up print layout.
 *
 * 1-up: standard portrait output with page breaks between pages.
 * 2-up / 4-up: landscape A4 output; each portrait page is scaled to fit its cell.
 *
 * Scale maths (portrait A4 = 210mm × 297mm, landscape A4 margins 4mm):
 *   usable area = 289mm × 202mm
 *   2-up cell   = 142.5mm × 202mm  → scale ≈ 0.679  (142.5/210 and 202/297 both ≈ 0.679 ✓)
 *   4-up cell   = 142.5mm × 99mm   → scale ≈ 0.333  (height-limited: 99/297)
 */
function buildNupHtml(pages: string[], pagesPerSheet: 1 | 2 | 4, originalStyles: string): string {
  if (pagesPerSheet === 1) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
${originalStyles}
.nup-break { page-break-after: always; }
</style></head><body>${pages
      .map((p, i) => (i < pages.length - 1 ? `${p}<div class="nup-break"></div>` : p))
      .join('')}</body></html>`;
  }

  const cols = 2;
  const rows = pagesPerSheet === 4 ? 2 : 1;
  const scale = pagesPerSheet === 2 ? 0.679 : 0.333;
  const cellH = pagesPerSheet === 2 ? '202mm' : '99mm';

  // Group pages into per-sheet buckets
  const sheets: string[][] = [];
  for (let i = 0; i < pages.length; i += pagesPerSheet) {
    sheets.push(pages.slice(i, i + pagesPerSheet));
  }

  const sheetsHtml = sheets
    .map((sheetPages, si) => {
      const cells = sheetPages
        .map((content) => `<div class="nup-cell"><div class="nup-scale">${content}</div></div>`)
        .join('');
      return `<div class="nup-sheet${si < sheets.length - 1 ? ' nup-break' : ''}">${cells}</div>`;
    })
    .join('');

  // Scope the original styles inside .nup-scale and replace viewport-relative heights
  const scopedStyles = originalStyles.replace(/100vh/g, '297mm');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
@page { size: A4 landscape; margin: 4mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
.nup-sheet {
  display: grid;
  grid-template-columns: repeat(${cols}, 142.5mm);
  grid-template-rows: repeat(${rows}, ${cellH});
  gap: 4mm;
  width: 289mm;
}
.nup-break { page-break-after: always; }
.nup-cell {
  position: relative;
  overflow: hidden;
  border: 0.3mm solid #e2e8f0;
}
.nup-scale {
  position: absolute;
  top: 0;
  left: 0;
  width: 210mm;
  height: 297mm;
  transform: scale(${scale});
  transform-origin: top left;
}
${scopedStyles}
</style></head><body>${sheetsHtml}</body></html>`;
}

/**
 * Apply page range, N-up layout, and copies to an HTML print document.
 * Returns the original HTML unchanged when config matches the defaults.
 */
export function applyPrintConfig(html: string, config: PrintConfig): string {
  const { pageRange, pagesPerSheet, copies } = config;
  if (pageRange === 'all' && pagesPerSheet === 1 && copies === 1) return html;

  const originalStyles = extractHeadStyles(html);
  const allPages = splitHtmlIntoPages(html);

  const indices = parsePageRange(pageRange, allPages.length);
  let selected = indices.length > 0 ? indices.map((i) => allPages[i]).filter(Boolean) : allPages;

  if (copies > 1) {
    const base = [...selected];
    for (let c = 1; c < copies; c++) selected = [...selected, ...base];
  }

  return buildNupHtml(selected, pagesPerSheet, originalStyles);
}

// ── printHtml ─────────────────────────────────────────────────────────────────

export interface PrintHtmlOptions {
  printerName?: string;
  /** Called at each stage transition so the caller can update UI incrementally. */
  onStageChange?: (stage: PrintStage) => void;
  /** Optional print configuration for page range, N-up layout, and copies. */
  config?: PrintConfig;
}

/**
 * Print an HTML string with per-stage feedback.
 *
 * - **Electron**: silently prints via IPC — no dialog. Emits stage transitions:
 *   `preparing → spooling → printing → complete | error`
 * - **Browser**: opens a hidden window + browser print dialog as fallback.
 *   Stages emitted: `preparing → spooling → complete` (printing stage is N/A).
 *
 * @returns `PrintResult` with `{ success, stage, error?, errorCode? }`
 */
export async function printHtml(
  html: string,
  options: PrintHtmlOptions = {}
): Promise<PrintResult> {
  const { printerName, onStageChange, config } = options;
  const transformedHtml = config ? applyPrintConfig(html, config) : html;

  const emit = (stage: PrintStage) => onStageChange?.(stage);

  emit('preparing');

  if (isElectron()) {
    // Register the stage listener BEFORE invoking IPC so we don't miss the
    // 'printing' event that the main process sends right after print() is called.
    const stageHandler = (stage: PrintStage) => emit(stage);
    window.electronAPI!.onPrintStage(stageHandler);

    try {
      emit('spooling');
      const result = await window.electronAPI!.print({ html: transformedHtml, printerName });

      // Enrich with human-readable error message if needed
      if (!result.success && result.error && !('errorCode' in result)) {
        return {
          success: false,
          stage: 'error',
          error: friendlyPrintError(result.error),
          errorCode: result.error,
        };
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, stage: 'error', error: message };
    } finally {
      window.electronAPI!.offPrintStage(stageHandler);
    }
  }

  // Browser fallback — opens a transient window and triggers the print dialog
  emit('spooling');
  const win = window.open('', '_blank', 'width=800,height=600');
  if (!win) {
    return {
      success: false,
      stage: 'error',
      error: 'Could not open print window. Check your browser pop-up settings.',
    };
  }

  win.document.write(transformedHtml);
  win.document.close();
  win.focus();
  win.print();
  setTimeout(() => win.close(), 500);

  emit('complete');
  return { success: true, stage: 'complete' };
}

// ── PDF printing ──────────────────────────────────────────────────────────────

export interface PdfPrintConfig {
  colorMode: 'color' | 'blackwhite';
  duplex: 'simplex' | 'longEdge' | 'shortEdge';
  copies: number;
  /** 'all' or a 1-indexed range like '2-5' or '1,3' — passed straight to CUPS page-ranges */
  pageRange: 'all' | string;
}

export const DEFAULT_PDF_PRINT_CONFIG: PdfPrintConfig = {
  colorMode: 'color',
  duplex: 'simplex',
  copies: 1,
  pageRange: 'all',
};

export interface PrintPdfOptions {
  printerName?: string;
  onStageChange?: (stage: PrintStage) => void;
  config?: PdfPrintConfig;
}

/**
 * Print a PDF file by URL with per-stage feedback.
 *
 * - **Electron**: fetches the PDF as ArrayBuffer, sends via IPC with all config options.
 * - **Browser**: opens the PDF URL in a new tab as a fallback.
 */
export async function printPdfFile(
  pdfUrl: string,
  options: PrintPdfOptions = {}
): Promise<PrintResult> {
  const { printerName, onStageChange, config } = options;
  const emit = (stage: PrintStage) => onStageChange?.(stage);

  emit('preparing');

  if (isElectron()) {
    let fileData: ArrayBuffer;
    try {
      const res = await fetch(pdfUrl);
      fileData = await res.arrayBuffer();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load PDF';
      return { success: false, stage: 'error', error: message };
    }

    const stageHandler = (stage: PrintStage) => emit(stage);
    window.electronAPI!.onPrintStage(stageHandler);

    const fileName = pdfUrl.split('/').pop() ?? 'test.pdf';

    try {
      emit('spooling');
      const result = await window.electronAPI!.printFile({
        fileData,
        fileName,
        printerName,
        copies: config?.copies,
        colorMode: config?.colorMode,
        duplex: config?.duplex,
        pageRange: config?.pageRange === 'all' ? undefined : config?.pageRange,
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, stage: 'error', error: message };
    } finally {
      window.electronAPI!.offPrintStage(stageHandler);
    }
  }

  // Browser fallback — open PDF in a new tab
  window.open(pdfUrl, '_blank');
  emit('complete');
  return { success: true, stage: 'complete' };
}

/** Maps Electron's raw errorType strings to user-friendly messages. */
function friendlyPrintError(errorType: string): string {
  const map: Record<string, string> = {
    cancelled: 'Print job was cancelled.',
    failed: 'The printer reported a failure. Check that it is online.',
    invalid: 'Invalid print options were supplied.',
  };
  return map[errorType.toLowerCase()] ?? `Print error: ${errorType}`;
}
