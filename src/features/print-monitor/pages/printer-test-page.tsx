import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Palette,
  FileStack,
  ImageIcon,
  Code2,
  Play,
  Trash2,
  RefreshCw,
  Terminal,
  Printer,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NumberInput } from '@/components/form/number-input';
import { cn } from '@/lib/utils';
import {
  printHtml,
  printPdfFile,
  type PrintConfig,
  type PdfPrintConfig,
  DEFAULT_PRINT_CONFIG,
  DEFAULT_PDF_PRINT_CONFIG,
} from '@/lib/electron-print';
import pdfTestFileUrl from '../test-content/testprintfile.pdf?url';
import type { PrintStage } from '@/types/electron';
import { PrinterStatusCard } from '../components/printer-status-card';
import { PrinterListCard } from '../components/printer-list-card';
import { usePrinterFeedback } from '../hooks';
import { colorTestHtml } from '../test-content/color-test-html';
import { multipageTestHtml } from '../test-content/multipage-test-html';
import { imageTestHtml, getTestImageDataUrl } from '../test-content/image-test-html';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StageLogEntry {
  id: number;
  stage: PrintStage | 'triggered' | 'done' | 'failed';
  label: string;
  timestamp: Date;
}

const STAGE_COLORS: Record<string, string> = {
  triggered: 'text-muted-foreground',
  preparing: 'text-amber-600 dark:text-amber-400',
  spooling: 'text-blue-600 dark:text-blue-400',
  printing: 'text-primary',
  complete: 'text-green-600 dark:text-green-400',
  done: 'text-green-600 dark:text-green-400',
  error: 'text-destructive',
  failed: 'text-destructive',
  idle: 'text-muted-foreground',
};

const STAGE_ICONS: Record<string, React.ElementType> = {
  complete: CheckCircle2,
  done: CheckCircle2,
  error: AlertCircle,
  failed: AlertCircle,
};

const STAGE_LABELS: Record<string, string> = {
  idle: 'Idle',
  preparing: 'Preparing document…',
  spooling: 'Spooling to printer…',
  printing: 'Printing…',
  complete: 'Print complete ✓',
  error: 'Print error ✗',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StageLog({ entries, onClear }: { entries: StageLogEntry[]; onClear: () => void }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card-soft">
      <div className="flex items-center justify-between bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-muted-foreground" />
          <p className="text-sm font-bold text-foreground">Live Event Log</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3" />
          Clear
        </Button>
      </div>

      <div className="h-64 overflow-y-auto bg-muted/20 p-4 font-mono text-xs">
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No events yet. Trigger a test print to see stage events.
          </p>
        ) : (
          entries.map((e) => {
            const Icon = STAGE_ICONS[e.stage] ?? null;
            return (
              <div key={e.id} className={cn('mb-1 flex items-start gap-2', STAGE_COLORS[e.stage])}>
                <span className="shrink-0 text-muted-foreground/60">
                  [{e.timestamp.toLocaleTimeString()}]
                </span>
                {Icon && <Icon className="mt-0.5 size-3 shrink-0" />}
                <span>{e.label}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

interface TestCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  preview?: React.ReactNode;
  onPrint: () => void;
  isPrinting: boolean;
}

function TestCard({ icon: Icon, title, description, preview, onPrint, isPrinting }: TestCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border/60 p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Icon className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {preview && (
          <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20">
            {preview}
          </div>
        )}
      </div>
      <div className="p-5">
        <Button className="w-full gap-2 rounded-full" onClick={onPrint} disabled={isPrinting}>
          {isPrinting ? <RefreshCw className="size-4 animate-spin" /> : <Play className="size-4" />}
          {isPrinting ? 'Printing…' : `Print ${title}`}
        </Button>
      </div>
    </div>
  );
}

// ── Print Config Panel ────────────────────────────────────────────────────────

interface PrintConfigPanelProps {
  config: PrintConfig;
  onChange: (config: PrintConfig) => void;
  isElectron: boolean;
}

function PrintConfigPanel({ config, onChange, isElectron }: PrintConfigPanelProps) {
  const isRangeMode = config.pageRange !== 'all';
  const isDefault = config.pageRange === 'all' && config.pagesPerSheet === 1 && config.copies === 1;

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card-soft">
      <div className="flex items-center gap-2 bg-muted/30 px-6 py-4">
        <SlidersHorizontal className="size-4 text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">Print Configuration</p>
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          APPLIES TO ALL TESTS
        </span>
      </div>

      <div className="flex flex-wrap items-start gap-6 p-6">
        {/* Pages group */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Pages
          </Label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className={cn(!isRangeMode && 'border-primary bg-primary/10 text-primary')}
              onClick={() => onChange({ ...config, pageRange: 'all' })}
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(isRangeMode && 'border-primary bg-primary/10 text-primary')}
              onClick={() =>
                onChange({ ...config, pageRange: isRangeMode ? config.pageRange : '1' })
              }
            >
              Range
            </Button>
          </div>
          {isRangeMode && (
            <>
              <Input
                className="h-8 w-28 text-xs"
                placeholder="e.g. 1-3 or 1,3"
                value={config.pageRange}
                onChange={(e) => onChange({ ...config, pageRange: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">For single-page tests, use "1"</p>
            </>
          )}
        </div>

        {/* N-up group */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Pages per Sheet
          </Label>
          <Select
            value={String(config.pagesPerSheet)}
            onValueChange={(v) => onChange({ ...config, pagesPerSheet: Number(v) as 1 | 2 | 4 })}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 (Normal)</SelectItem>
              <SelectItem value="2">2 (2-up)</SelectItem>
              <SelectItem value="4">4 (4-up)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Copies group */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Copies
          </Label>
          <NumberInput
            className="h-8 w-20 text-xs"
            min={1}
            max={20}
            value={config.copies}
            onChange={(v) => onChange({ ...config, copies: Math.max(1, Math.min(20, v ?? 1)) })}
          />
          {!isElectron && config.copies > 1 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Browser: dialog may duplicate
            </p>
          )}
        </div>

        {/* Reset — only shown when config differs from defaults */}
        {!isDefault && (
          <div className="flex flex-col justify-end self-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => onChange(DEFAULT_PRINT_CONFIG)}
            >
              Reset
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PDF Print Config Panel ────────────────────────────────────────────────────

interface PdfPrintConfigPanelProps {
  config: PdfPrintConfig;
  onChange: (config: PdfPrintConfig) => void;
  onPrint: () => void;
  isPrinting: boolean;
}

function PdfPrintConfigPanel({ config, onChange, onPrint, isPrinting }: PdfPrintConfigPanelProps) {
  const isRangeMode = config.pageRange !== 'all';
  const isDefault =
    config.colorMode === 'color' &&
    config.duplex === 'simplex' &&
    config.copies === 1 &&
    config.pageRange === 'all';

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card-soft">
      <div className="flex items-center gap-2 bg-muted/30 px-6 py-4">
        <FileText className="size-4 text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">PDF Print Configuration</p>
        <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          PDF ONLY
        </span>
      </div>

      <div className="flex flex-wrap items-start gap-6 p-6">
        {/* Color mode */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Color Mode
          </Label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                config.colorMode === 'color' && 'border-primary bg-primary/10 text-primary'
              )}
              onClick={() => onChange({ ...config, colorMode: 'color' })}
            >
              Color
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                config.colorMode === 'blackwhite' && 'border-primary bg-primary/10 text-primary'
              )}
              onClick={() => onChange({ ...config, colorMode: 'blackwhite' })}
            >
              B&W
            </Button>
          </div>
        </div>

        {/* Duplex */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Sides
          </Label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                config.duplex === 'simplex' && 'border-primary bg-primary/10 text-primary'
              )}
              onClick={() => onChange({ ...config, duplex: 'simplex' })}
            >
              1-Sided
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                config.duplex === 'longEdge' && 'border-primary bg-primary/10 text-primary'
              )}
              onClick={() => onChange({ ...config, duplex: 'longEdge' })}
            >
              2-Sided ↕
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                config.duplex === 'shortEdge' && 'border-primary bg-primary/10 text-primary'
              )}
              onClick={() => onChange({ ...config, duplex: 'shortEdge' })}
            >
              2-Sided ↔
            </Button>
          </div>
        </div>

        {/* Page range */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Pages
          </Label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className={cn(!isRangeMode && 'border-primary bg-primary/10 text-primary')}
              onClick={() => onChange({ ...config, pageRange: 'all' })}
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(isRangeMode && 'border-primary bg-primary/10 text-primary')}
              onClick={() =>
                onChange({ ...config, pageRange: isRangeMode ? config.pageRange : '2' })
              }
            >
              Range
            </Button>
          </div>
          {isRangeMode && (
            <>
              <Input
                className="h-8 w-28 text-xs"
                placeholder="e.g. 2-5 or 2,4"
                value={config.pageRange}
                onChange={(e) => onChange({ ...config, pageRange: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">Skip page 1: use "2-N"</p>
            </>
          )}
        </div>

        {/* Copies */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Copies
          </Label>
          <NumberInput
            className="h-8 w-20 text-xs"
            min={1}
            max={20}
            value={config.copies}
            onChange={(v) => onChange({ ...config, copies: Math.max(1, Math.min(20, v ?? 1)) })}
          />
        </div>

        {!isDefault && (
          <div className="flex flex-col justify-end self-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => onChange(DEFAULT_PDF_PRINT_CONFIG)}
            >
              Reset
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-border/60 px-6 py-4">
        <Button className="w-full gap-2 rounded-full" onClick={onPrint} disabled={isPrinting}>
          {isPrinting ? <RefreshCw className="size-4 animate-spin" /> : <Play className="size-4" />}
          {isPrinting ? 'Printing…' : 'Print testprintfile.pdf'}
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function PrinterTestPage() {
  const printer = usePrinterFeedback();
  const [isPrinting, setIsPrinting] = useState(false);
  const [printConfig, setPrintConfig] = useState<PrintConfig>(DEFAULT_PRINT_CONFIG);
  const [pdfPrintConfig, setPdfPrintConfig] = useState<PdfPrintConfig>(DEFAULT_PDF_PRINT_CONFIG);
  const [customHtml, setCustomHtml] = useState(
    '<h1 style="color:#3182CE;font-family:sans-serif;text-align:center;margin-top:40px;">Custom Test Print</h1>'
  );
  const [logEntries, setLogEntries] = useState<StageLogEntry[]>([]);
  const logIdRef = useRef(0);

  const addLog = useCallback((stage: StageLogEntry['stage'], label: string) => {
    setLogEntries((prev) => [
      ...prev,
      { id: ++logIdRef.current, stage, label, timestamp: new Date() },
    ]);
  }, []);

  const runPrint = useCallback(
    async (html: string, label: string) => {
      if (isPrinting) return;
      setIsPrinting(true);
      addLog('triggered', `▶ ${label} triggered`);

      const result = await printHtml(html, {
        printerName: printer.printerSystemName ?? undefined,
        config: printConfig,
        onStageChange: (stage) => addLog(stage, STAGE_LABELS[stage] ?? stage),
      });

      if (result.success) {
        addLog('done', `✓ ${label} finished successfully`);
      } else {
        addLog('failed', `✗ ${label} failed: ${result.error ?? 'Unknown error'}`);
      }

      setIsPrinting(false);
    },
    [isPrinting, printer.printerSystemName, printConfig, addLog]
  );

  const runPdfPrint = useCallback(async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    addLog('triggered', '▶ PDF Test Print triggered');
    const result = await printPdfFile(pdfTestFileUrl, {
      printerName: printer.printerSystemName ?? undefined,
      config: pdfPrintConfig,
      onStageChange: (stage) => addLog(stage, STAGE_LABELS[stage] ?? stage),
    });
    if (result.success) {
      addLog('done', '✓ PDF Test finished successfully');
    } else {
      addLog('failed', `✗ PDF Test failed: ${result.error ?? 'Unknown error'}`);
    }
    setIsPrinting(false);
  }, [isPrinting, printer.printerSystemName, pdfPrintConfig, addLog]);

  const testPrintQueue = useCallback(async () => {
    if (typeof window.electronAPI?.getPrintQueue === 'function') {
      addLog('triggered', '▶ Fetching print queue…');
      try {
        const queue = await window.electronAPI.getPrintQueue!();
        addLog(
          'done',
          `Print queue: ${queue.length} job(s) — ${queue.map((j) => j.fileName).join(', ') || 'none'}`
        );
      } catch (err) {
        addLog('failed', `getPrintQueue failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    } else {
      addLog('error', 'getPrintQueue is not available in this version of the companion app.');
    }
  }, [addLog]);

  const testHello = useCallback(async () => {
    if (!printer.isElectron) {
      addLog('error', 'Not running in Electron companion app.');
      return;
    }
    addLog('triggered', '▶ Running printHello() IPC test…');
    try {
      const ok = await window.electronAPI!.printHello();
      addLog(
        ok ? 'done' : 'failed',
        ok ? '✓ printHello() returned true' : '✗ printHello() returned false'
      );
    } catch (err) {
      addLog('failed', `printHello() threw: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }, [printer.isElectron, addLog]);

  const testImageDataUrl = getTestImageDataUrl();

  return (
    <div className="min-h-full p-8">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 dark:bg-amber-900/30">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">DEV ONLY</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Printer Test Console</h1>
          <p className="mt-1 text-muted-foreground">
            Test companion app printer feedback, supply levels, and print stage events.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2">
          <Printer className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {printer.isElectron ? (printer.printerName ?? 'No printer') : 'Browser mode'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left column — printer status */}
        <div className="space-y-6 lg:col-span-5">
          <PrinterStatusCard />
          <PrinterListCard />

          {/* IPC diagnostics */}
          <div className="overflow-hidden rounded-xl bg-card shadow-card-soft">
            <div className="bg-muted/30 px-6 py-4">
              <p className="text-sm font-bold text-foreground">IPC Diagnostics</p>
              <p className="text-xs text-muted-foreground">Test low-level Electron API calls</p>
            </div>
            <div className="space-y-3 p-6">
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={testHello}>
                <Play className="size-3.5" />
                Run printHello()
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={testPrintQueue}>
                <Play className="size-3.5" />
                Fetch Print Queue
              </Button>
            </div>
          </div>
        </div>

        {/* Right column — test controls + log */}
        <div className="space-y-6 lg:col-span-7">
          <PrintConfigPanel
            config={printConfig}
            onChange={setPrintConfig}
            isElectron={printer.isElectron}
          />

          <PdfPrintConfigPanel
            config={pdfPrintConfig}
            onChange={setPdfPrintConfig}
            onPrint={runPdfPrint}
            isPrinting={isPrinting}
          />

          {/* Test cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <TestCard
              icon={Palette}
              title="Color Test"
              description="Prints 'Hello' in 5 colors to verify color accuracy"
              isPrinting={isPrinting}
              onPrint={() => runPrint(colorTestHtml(), 'Color Test')}
              preview={
                <div className="flex items-center justify-around px-4 py-3">
                  {['#E53E3E', '#3182CE', '#38A169', '#DD6B20', '#805AD5'].map((color) => (
                    <span key={color} className="text-lg font-black" style={{ color }}>
                      Hello
                    </span>
                  ))}
                </div>
              }
            />

            <TestCard
              icon={FileStack}
              title="Multi-Page Test"
              description="Prints 5 pages (Hello 1–5) to verify page breaks"
              isPrinting={isPrinting}
              onPrint={() => runPrint(multipageTestHtml(), 'Multi-Page Test')}
              preview={
                <div className="flex gap-1 px-4 py-3">
                  {['#E53E3E', '#3182CE', '#38A169', '#DD6B20', '#805AD5'].map((color, i) => (
                    <div
                      key={i}
                      className="flex flex-1 items-center justify-center rounded py-2 text-xs font-black text-white"
                      style={{ background: color }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              }
            />

            <TestCard
              icon={ImageIcon}
              title="Image Test"
              description="Prints a colorful test image with stripes"
              isPrinting={isPrinting}
              onPrint={() => runPrint(imageTestHtml(), 'Image Test')}
              preview={
                <img
                  src={testImageDataUrl}
                  alt="Test image preview"
                  className="h-20 w-full object-cover"
                />
              }
            />

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border/60 p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <Code2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Custom HTML</p>
                    <p className="text-xs text-muted-foreground">Type any HTML to print</p>
                  </div>
                </div>
                <Textarea
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  className="h-24 font-mono text-xs"
                  placeholder="Enter HTML to print..."
                />
              </div>
              <div className="p-5">
                <Button
                  className="w-full gap-2 rounded-full"
                  onClick={() => runPrint(customHtml, 'Custom HTML')}
                  disabled={isPrinting || !customHtml.trim()}
                >
                  {isPrinting ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  {isPrinting ? 'Printing…' : 'Print Custom HTML'}
                </Button>
              </div>
            </div>
          </div>

          {/* Live event log */}
          <StageLog entries={logEntries} onClear={() => setLogEntries([])} />
        </div>
      </div>
    </div>
  );
}
