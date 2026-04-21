import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { profileService } from '../services';

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const { mutate: deleteAccount, isPending } = profileService.useDeleteMe();

  return (
    <div className="flex items-start justify-between gap-6 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-5">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
          <AlertTriangle className="size-4 text-destructive" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">Account Deactivation</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
      </div>
      <Button variant="destructive" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
        Deactivate
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your Easy Print account, all print history, and your
              printing stand QR code. This action{' '}
              <span className="font-semibold text-destructive">cannot be undone</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={isPending}
              onClick={() => deleteAccount()}
            >
              {isPending ? 'Deleting…' : 'Yes, delete my account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
