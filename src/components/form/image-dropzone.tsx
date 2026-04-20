import { commonService } from '@/services';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Accept, useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

type DropzoneProps = {
  accept?: Accept;
  multiple?: boolean;
  value?: string; // base64 or url for preview
  uploadKey?: string; // base64 or url for preview
  onChange: (path: string) => void;
};

export const ImageDropzone: React.FC<DropzoneProps> = ({
  accept,
  multiple = false,
  value,
  onChange,
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  // localPreview holds a temporary base64 preview while uploading
  const [localPreview, setLocalPreview] = useState<string | undefined>(undefined);

  // Derive display preview: committed value takes precedence over local base64 preview
  const displayPreview = value || localPreview;

  const uploadFileMutation = commonService.useUploadImage();

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop: (files) => {
      if (files?.[0]) {
        setUploadProgress(10);

        uploadFileMutation.mutate(files[0], {
          onSuccess: (data) => {
            if (data?.data?.location) {
              onChange(data.data.location);
              toast.success('File uploaded successfully');
              setUploadProgress(100);
              setLocalPreview(undefined);
            } else {
              toast.error('Failed to get file location');
              setUploadProgress(0);
            }
          },
          onError: (error) => {
            console.error('Error uploading file:', error);
            toast.error('Failed to upload file');
            setUploadProgress(0);
            setLocalPreview(undefined);
          },
        });
      }
    },
    accept,
    multiple,
  });

  useEffect(() => {
    if (acceptedFiles && acceptedFiles[0]) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => setLocalPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, [acceptedFiles]);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalPreview(undefined);
    setUploadProgress(0);
    onChange('');
  };

  return (
    <div
      {...getRootProps()}
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors duration-200 ${
        isDragActive ? 'border-primary bg-primary/10' : 'border-border'
      } hover:border-primary hover:bg-primary/5`}
    >
      <input {...getInputProps()} />
      {uploadProgress > 0 && uploadProgress < 100 && displayPreview && (
        <div className="absolute top-[50%] left-0 h-1 w-full bg-primary/10">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
      {displayPreview && (
        <div className="relative mb-2">
          <img src={displayPreview} alt="Preview" className="h-24 w-auto rounded object-contain" />
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="absolute top-0 z-10 flex h-full w-full items-center justify-center bg-background/70">
              <div className="bg-primary py-1 text-center text-xs text-primary-foreground">
                {uploadProgress}%
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="hover:text-destructive-foreground absolute -top-2 -right-2 z-20 rounded-full border border-border bg-background p-1 shadow transition-colors hover:bg-destructive"
            tabIndex={-1}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <p className="text-center text-muted-foreground">
        {isDragActive ? 'Drop the files here...' : 'Drag & drop an image here, or click to select'}
      </p>
    </div>
  );
};

export default ImageDropzone;
