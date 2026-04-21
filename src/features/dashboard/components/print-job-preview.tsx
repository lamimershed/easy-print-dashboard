import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PrintJobPreviewProps {
  job: {
    fileName: string;
    fileType: string;
    fileSize: number;
    copies: number;
    colorMode: string;
  };
  status: 'incoming' | 'printing';
  onComplete: () => void;
  onError: (error: string) => void;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function PrintJobPreview({ job, status, onComplete, onError }: PrintJobPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" />
          Incoming Print Job
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">File</p>
            <p className="truncate font-medium">{job.fileName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Size</p>
            <p>{formatBytes(job.fileSize)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Copies</p>
            <p>{job.copies}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Color Mode</p>
            <Badge variant="secondary">{job.colorMode}</Badge>
          </div>
        </div>

        {status === 'printing' && (
          <div className="flex gap-3 pt-2">
            <Button className="flex-1 gap-2" onClick={() => onComplete()}>
              <CheckCircle className="size-4" />
              Mark as Printed
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={() => onError('Print error')}
            >
              <AlertCircle className="size-4" />
              Report Error
            </Button>
          </div>
        )}

        {status === 'incoming' && (
          <p className="text-center text-sm text-muted-foreground">Receiving file from customer…</p>
        )}
      </CardContent>
    </Card>
  );
}
