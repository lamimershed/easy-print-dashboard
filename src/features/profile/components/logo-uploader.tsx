import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadService } from '@/features/upload/services';
import { profileService } from '../services';

interface LogoUploaderProps {
  currentLogoUrl: string | null;
}

export function LogoUploader({ currentLogoUrl }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = uploadService.useClientLogoUpload();
  const updateMutation = profileService.useUpdateMe();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        updateMutation.mutate({ logoUrl: data.url });
      },
    });
  };

  const isPending = uploadMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex items-center gap-4">
      {currentLogoUrl ? (
        <img
          src={currentLogoUrl}
          alt="Shop logo"
          className="h-16 w-16 rounded-lg border border-border object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
          <Upload className="size-5 text-muted-foreground" />
        </div>
      )}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? 'Uploading…' : 'Change Logo'}
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP · max 5 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
