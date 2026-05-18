import { useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Download,
  Printer,
  Lightbulb,
  QrCode,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useElectronPrinter } from '@/hooks';
import { isElectron } from '@/lib/electron-print';
import { usePrintStandee } from '../hooks/use-print-standee';
import type { PrintStage } from '../hooks/use-print-standee';

interface PrintingStandQrProps {
  slug: string;
  companyName: string;
}

const STAGE_LABELS: Partial<Record<PrintStage, string>> = {
  preparing: 'Preparing…',
  spooling: 'Sending to printer…',
  printing: 'Printing…',
};

export function PrintingStandQr({ slug, companyName }: PrintingStandQrProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { printerName, printerSystemName, isLoading: printerLoading } = useElectronPrinter();
  const { print, isPending, stage, error, result, reset } = usePrintStandee();

  const customerUrl = `${import.meta.env.VITE_CUSTOMER_APP_URL ?? window.location.origin}/${slug}`;

  // Auto-reset error banner after 5 s
  useEffect(() => {
    if (stage === 'error') {
      const timer = setTimeout(reset, 5000);
      return () => clearTimeout(timer);
    }
  }, [stage, reset]);

  // Show success toast once complete
  useEffect(() => {
    if (stage === 'complete' && result?.success) {
      const description = isElectron() && printerName ? `Sent to: ${printerName}` : undefined;
      toast.success('Standee printed!', { description });
    }
  }, [stage, result, printerName]);

  const buildStandeeHtml = (dataUrl: string) => `<!DOCTYPE html>
<html>
  <head>
    <title>${companyName} — Print Standee</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: sans-serif;
        background: #fff;
        padding: 2rem;
      }
      img { width: 280px; height: 280px; }
      h2 {
        font-size: 1.5rem;
        font-weight: 900;
        letter-spacing: 0.1em;
        color: #00694e;
        margin-top: 1rem;
      }
      p { color: #5c5b5b; font-size: 0.85rem; margin-top: 0.5rem; }
    </style>
  </head>
  <body>
    <img src="${dataUrl}" alt="QR Code" />
    <h2>SCAN TO PRINT</h2>
    <p>${companyName}</p>
  </body>
</html>`;

  const handleDownloadPng = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      toast.error('QR canvas not ready');
      return;
    }
    const link = document.createElement('a');
    link.download = `${companyName.replace(/\s+/g, '-')}-qr-code.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('QR code downloaded!');
  };

  const handlePrintStandee = async () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      toast.error('QR canvas not ready');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const html = buildStandeeHtml(dataUrl);
    await print(html, printerSystemName ?? undefined);
  };

  const buttonLabel = isPending && STAGE_LABELS[stage] ? STAGE_LABELS[stage] : 'Print Standee';
  const isSuccess = stage === 'complete';

  return (
    <div className="flex flex-col gap-6">
      {/* QR Card */}
      <div className="relative overflow-hidden rounded-xl bg-card p-8 text-center shadow-card-soft">
        {/* Decorative blur */}
        <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative z-10">
          {/* Header */}
          <div className="mb-4 flex items-center justify-center gap-3">
            <QrCode className="size-7 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Printing Stand QR</h3>
          </div>
          <p className="mb-8 px-4 text-sm text-muted-foreground">
            Place this QR code at your shop's printing station. Customers can scan to upload and
            print instantly.
          </p>

          {/* QR Frame */}
          <div className="mx-auto mb-8 inline-block rounded-xl border-4 border-white bg-muted/30 p-5 shadow-card-soft">
            <div className="rounded-lg bg-white p-4">
              <QRCodeCanvas
                id="qr-canvas"
                ref={canvasRef}
                value={customerUrl}
                size={192}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="mt-4 text-lg font-black tracking-tight text-primary">SCAN TO PRINT</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="gap-2 rounded-full py-6 text-sm font-bold"
              onClick={handleDownloadPng}
              disabled={isPending}
            >
              <Download className="size-4" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              className={
                isSuccess
                  ? 'gap-2 rounded-full border-primary/30 bg-primary/10 py-6 text-sm font-bold text-primary'
                  : 'gap-2 rounded-full border-lime-300 bg-lime-100 py-6 text-sm font-bold text-lime-800 hover:bg-lime-200 dark:border-lime-700 dark:bg-lime-900 dark:text-lime-200 dark:hover:bg-lime-800'
              }
              onClick={handlePrintStandee}
              disabled={isPending || printerLoading}
              title={isElectron() && printerName ? `Print to: ${printerName}` : undefined}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isSuccess ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <Printer className="size-4" />
              )}
              {buttonLabel}
            </Button>
          </div>

          {/* Error banner */}
          {stage === 'error' && error && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-left">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">Print failed</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
              <button
                className="text-xs text-destructive/60 hover:text-destructive"
                onClick={reset}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Stage indicator while pending */}
          {isPending && (
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{STAGE_LABELS[stage]}</span>
              {isElectron() && printerName && (
                <>
                  {' '}
                  — <span className="font-semibold">{printerName}</span>
                </>
              )}
            </p>
          )}

          {/* Printer name hint (Electron only, idle state) */}
          {!isPending && stage !== 'error' && isElectron() && printerName && (
            <p className="mt-3 text-xs text-muted-foreground">
              Will print to: <span className="font-semibold text-foreground">{printerName}</span>
            </p>
          )}
        </div>
      </div>

      {/* Pro Tip */}
      <div className="flex items-start gap-4 rounded-xl bg-primary/10 p-6">
        <div className="rounded-full bg-white/60 p-2 dark:bg-white/10">
          <Lightbulb className="size-5 text-primary" />
        </div>
        <div>
          <h4 className="mb-1 font-bold text-primary">Pro Tip</h4>
          <p className="text-sm leading-relaxed text-primary/80">
            Displaying the QR code on an acrylic stand near the entrance increases self-service
            usage by up to 40%.
          </p>
        </div>
      </div>
    </div>
  );
}
