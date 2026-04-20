import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Users, Printer } from 'lucide-react';

type SessionStatus = 'idle' | 'waiting' | 'connected' | 'incoming' | 'printing';

interface SessionStatusCardProps {
  status: SessionStatus;
  isConnected: boolean;
}

const STATUS_CONFIG: Record<
  SessionStatus,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    variant: 'default' | 'secondary' | 'destructive';
  }
> = {
  idle: {
    label: 'Offline',
    description: 'Not connected to server',
    icon: WifiOff,
    variant: 'destructive',
  },
  waiting: {
    label: 'Waiting',
    description: 'Ready for a customer to scan your QR code',
    icon: Wifi,
    variant: 'secondary',
  },
  connected: {
    label: 'Customer Connected',
    description: 'A customer is connected and ready to send files',
    icon: Users,
    variant: 'default',
  },
  incoming: {
    label: 'Receiving File',
    description: 'Receiving file from customer…',
    icon: Printer,
    variant: 'default',
  },
  printing: {
    label: 'Print Ready',
    description: 'File received — ready to print',
    icon: Printer,
    variant: 'default',
  },
};

export function SessionStatusCard({ status, isConnected }: SessionStatusCardProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Session Status
          <div
            className={cn('size-2.5 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
        <div>
          <Badge variant={config.variant}>{config.label}</Badge>
          <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
