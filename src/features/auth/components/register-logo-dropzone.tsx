import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { uploadService } from '@/features/upload/services';
import { toast } from 'sonner';

type RegisterLogoDropzoneProps = {
  value?: string;
  onChange: (url: string) => void;
  error?: string;
};

export function RegisterLogoDropzone({ value, onChange, error }: RegisterLogoDropzoneProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const uploadMutation = uploadService.usePreRegisterUpload();

  const displayPreview = localPreview || value || null;
  const isUploading = uploadMutation.isPending;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [] },
    multiple: false,
    disabled: isUploading,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => setLocalPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      uploadMutation.mutate(file, {
        onSuccess: (data) => {
          onChange(data.url);
          setLocalPreview(null);
          toast.success('Logo uploaded');
        },
        onError: () => {
          setLocalPreview(null);
        },
      });
    },
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalPreview(null);
    onChange('');
  };

  return (
    <div className="space-y-1">
      <div
        {...getRootProps()}
        className={cn(
          'flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
          isDragActive
            ? 'border-primary bg-primary/10'
            : error
              ? 'border-destructive bg-destructive/5'
              : 'border-border bg-muted hover:border-primary hover:bg-primary/5',
          isUploading && 'cursor-not-allowed opacity-60'
        )}
      >
        <input {...getInputProps()} />

        {displayPreview ? (
          <div className="flex w-full items-center gap-3 px-3">
            <img
              src={displayPreview}
              alt="Logo preview"
              className="h-8 w-8 rounded object-cover ring-1 ring-border"
            />
            <span className="flex-1 truncate text-xs text-muted-foreground">
              {isUploading ? 'Uploading…' : 'Logo uploaded'}
            </span>
            {!isUploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="hover:text-destructive-foreground flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background shadow transition-colors hover:bg-destructive"
                tabIndex={-1}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <>
            <UploadCloud className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">
              {isUploading ? 'Uploading…' : isDragActive ? 'Drop here…' : 'Click to upload'}
            </span>
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
