import { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
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
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-border bg-muted transition-all hover:border-primary/50 disabled:pointer-events-none"
      >
        {currentLogoUrl ? (
          <img src={currentLogoUrl} alt="Shop logo" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Upload className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {isPending ? (
            <Loader2 className="size-5 animate-spin text-white" />
          ) : (
            <Upload className="size-5 text-white" />
          )}
        </div>
      </button>

      <div>
        <p className="text-sm font-semibold text-foreground">Shop Logo</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {isPending ? 'Uploading…' : 'Click to upload · JPEG, PNG, WebP · max 5 MB'}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
