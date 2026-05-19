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
import { usePrinterFeedback } from '@/features/print-monitor';
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
  const { printerName, printerSystemName, isLoading: printerLoading } = usePrinterFeedback();
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
    <meta charset="UTF-8" />
    <title>${companyName} — Print Standee</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #f0faf5;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .standee {
        width: 148mm;
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 32px rgba(0,0,0,0.12);
      }
      .top-band {
        background: #00694e;
        padding: 20px 24px 18px;
        text-align: center;
      }
      .brand-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.18em;
        color: rgba(255,255,255,0.7);
        text-transform: uppercase;
      }
      .company-name {
        font-size: 22px;
        font-weight: 900;
        color: #ffffff;
        margin-top: 4px;
        letter-spacing: -0.01em;
      }
      .body {
        padding: 28px 24px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .qr-frame {
        border: 3px solid #e8f7f1;
        border-radius: 12px;
        padding: 14px;
        background: #fff;
        box-shadow: 0 2px 12px rgba(0,105,78,0.08);
      }
      .qr-frame img { display: block; width: 200px; height: 200px; }
      .headline {
        margin-top: 20px;
        font-size: 26px;
        font-weight: 900;
        color: #00694e;
        letter-spacing: 0.1em;
        text-align: center;
      }
      .tagline {
        margin-top: 6px;
        font-size: 12px;
        color: #5c5b5b;
        text-align: center;
      }
      .url-pill {
        margin-top: 14px;
        padding: 5px 16px;
        background: #e8f7f1;
        border-radius: 999px;
        font-size: 11px;
        color: #00694e;
        font-weight: 600;
        word-break: break-all;
        text-align: center;
      }
      .bottom-band {
        margin-top: 20px;
        padding: 10px 24px;
        background: #f9f6f5;
        text-align: center;
        font-size: 9px;
        color: #9a9898;
        letter-spacing: 0.05em;
        border-top: 1px solid #e8e6e5;
      }
    </style>
  </head>
  <body>
    <div class="standee">
      <div class="top-band">
        <p class="brand-label">Easy Print</p>
        <p class="company-name">${companyName}</p>
      </div>
      <div class="body">
        <div class="qr-frame">
          <img src="${dataUrl}" alt="QR Code" />
        </div>
        <h2 class="headline">SCAN TO PRINT</h2>
        <p class="tagline">Upload &amp; print your documents instantly</p>
        <div class="url-pill">${customerUrl}</div>
      </div>
      <div class="bottom-band">Powered by Easy Print &middot; easyprint.io</div>
    </div>
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
    <div className="relative overflow-hidden rounded-xl bg-card p-6 text-center shadow-card-soft">
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-3 flex items-center justify-center gap-2.5">
          <QrCode className="size-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">Printing Stand QR</h3>
        </div>
        <p className="mb-5 px-2 text-xs text-muted-foreground">
          Place at your shop's station. Customers scan to upload and print instantly.
        </p>

        {/* QR Frame */}
        <div className="mx-auto mb-5 inline-block rounded-xl border-4 border-white bg-muted/30 p-4 shadow-card-soft">
          <div className="rounded-lg bg-white p-3">
            <QRCodeCanvas
              id="qr-canvas"
              ref={canvasRef}
              value={customerUrl}
              size={160}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="mt-3 text-sm font-black tracking-tight text-primary">SCAN TO PRINT</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            className="gap-2 rounded-full text-sm font-bold"
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
                ? 'gap-2 rounded-full border-primary/30 bg-primary/10 text-sm font-bold text-primary'
                : 'gap-2 rounded-full border-lime-300 bg-lime-100 text-sm font-bold text-lime-800 hover:bg-lime-200 dark:border-lime-700 dark:bg-lime-900 dark:text-lime-200 dark:hover:bg-lime-800'
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
          <div className="mt-3 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-left">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Print failed</p>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
            <button className="text-xs text-destructive/60 hover:text-destructive" onClick={reset}>
              Dismiss
            </button>
          </div>
        )}

        {/* Stage / printer hint */}
        {isPending && (
          <p className="mt-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{STAGE_LABELS[stage]}</span>
            {isElectron() && printerName && (
              <>
                {' '}
                — <span className="font-semibold">{printerName}</span>
              </>
            )}
          </p>
        )}
        {!isPending && stage !== 'error' && isElectron() && printerName && (
          <p className="mt-2.5 text-xs text-muted-foreground">
            Will print to: <span className="font-semibold text-foreground">{printerName}</span>
          </p>
        )}

        {/* Inline Pro Tip */}
        <div className="mt-5 flex items-center gap-2.5 border-t border-border/40 pt-4 text-left">
          <Lightbulb className="size-4 shrink-0 text-primary/60" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Place on an acrylic stand near the entrance to boost self-service by up to 40%.
          </p>
        </div>
      </div>
    </div>
  );
}
