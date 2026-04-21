import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, Lightbulb, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useElectronPrinter } from '@/hooks';
import { printHtml, isElectron } from '@/lib/electron-print';

interface PrintingStandQrProps {
  slug: string;
  companyName: string;
}

export function PrintingStandQr({ slug, companyName }: PrintingStandQrProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { printerName, isLoading: printerLoading } = useElectronPrinter();
  const customerUrl = `${import.meta.env.VITE_CUSTOMER_APP_URL ?? window.location.origin}/shop/${slug}`;

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

    const toastDescription =
      isElectron() && printerName ? `Printing to: ${printerName}` : undefined;

    const success = await printHtml(html);

    if (isElectron()) {
      if (success) {
        toast.success('Standee sent to printer!', { description: toastDescription });
      } else {
        toast.error('Print failed', {
          description: 'Check that your printer is connected and online.',
        });
      }
    }
  };

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
            >
              <Download className="size-4" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-full border-lime-300 bg-lime-100 py-6 text-sm font-bold text-lime-800 hover:bg-lime-200 dark:border-lime-700 dark:bg-lime-900 dark:text-lime-200 dark:hover:bg-lime-800"
              onClick={handlePrintStandee}
              disabled={printerLoading}
              title={isElectron() && printerName ? `Print to: ${printerName}` : undefined}
            >
              <Printer className="size-4" />
              Print Standee
            </Button>
          </div>

          {/* Printer name hint (Electron only) */}
          {isElectron() && printerName && (
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
