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
import { useState } from 'react';

// Reusable confirmation dialog
export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    desc: '',
    onConfirm: () => {},
  });

  const handleOpenDialog = ({
    desc,
    onConfirm,
    title,
  }: {
    title: string;
    desc: string;
    onConfirm: () => void;
  }) => {
    setConfig({ title, desc, onConfirm });
    setIsOpen(true);
  };

  const closeDialog = () => setIsOpen(false);

  const ConfirmationDialog = () => (
    <AlertDialog open={isOpen} onOpenChange={closeDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>{config.desc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={closeDialog}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              config.onConfirm();
              closeDialog();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { handleOpenDialog, ConfirmationDialog };
}
