import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QrCodeCardProps {
  slug: string;
  companyName: string;
}

export function QrCodeCard({ slug, companyName }: QrCodeCardProps) {
  const [copied, setCopied] = useState(false);
  const customerUrl = `${
    import.meta.env.VITE_CUSTOMER_APP_URL ??
    `${window.location.protocol}//${window.location.hostname}:5174`
  }/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(customerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your QR Code</CardTitle>
        <CardDescription>Customers scan this to send files to your printer</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="rounded-xl border border-border bg-white p-4">
          <QRCodeSVG value={customerUrl} size={180} />
        </div>
        <p className="text-center text-sm font-medium text-foreground">{companyName}</p>
        <p className="max-w-xs text-center text-xs break-all text-muted-foreground">
          {customerUrl}
        </p>
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
          {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
      </CardContent>
    </Card>
  );
}
