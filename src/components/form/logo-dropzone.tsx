import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageIcon, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type LogoDropzoneProps = {
  onChange: (file: File | null) => void;
  currentLogoUrl?: string | null;
  label?: string;
  className?: string;
};

export const LogoDropzone: React.FC<LogoDropzoneProps> = ({
  onChange,
  currentLogoUrl,
  label = 'Company Logo',
  className,
}) => {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [existingRemoved, setExistingRemoved] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => setLocalPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      setExistingRemoved(false);
      onChange(file);
    },
  });

  const displayPreview = localPreview || (!existingRemoved ? currentLogoUrl : null);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalPreview(null);
    setExistingRemoved(true);
    onChange(null);
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label>{label}</Label>}
      <div
        {...getRootProps()}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors duration-200',
          isDragActive ? 'border-primary bg-primary/10' : 'border-border',
          'hover:border-primary hover:bg-primary/5'
        )}
      >
        <input {...getInputProps()} />

        {displayPreview ? (
          <div className="relative">
            <img
              src={displayPreview}
              alt="Logo preview"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="hover:text-destructive-foreground absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background shadow transition-colors hover:bg-destructive"
              tabIndex={-1}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <ImageIcon className="h-8 w-8 opacity-40" />
            <p className="text-center text-xs">
              {isDragActive ? 'Drop the image here…' : 'Drag & drop a logo, or click to select'}
            </p>
            <p className="text-[10px] opacity-60">PNG, JPG, JPEG, WebP, SVG</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoDropzone;
