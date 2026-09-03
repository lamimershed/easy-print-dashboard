import { commonService, TFileUploadRequest } from '@/services';
import axios, { AxiosProgressEvent } from 'axios';
import { X } from 'lucide-react';
import React, { useState } from 'react';
import { Accept, useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { safeRandomUUID } from '@/utils/safe-uuid';

type MultipleImageDropzoneProps = {
  accept?: Accept;
  value?: string[]; // array of image URLs
  uploadKey: TFileUploadRequest['key'];
  onChange: (paths: string[]) => void;
  maxFiles?: number;
};

export const MultipleImageDropzone: React.FC<MultipleImageDropzoneProps> = ({
  accept,
  value = [],
  uploadKey,
  onChange,
  maxFiles = 5,
}) => {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [previews, setPreviews] = useState<string[]>(value);

  const uploadMutation = commonService.useGetPresignedUploadUrl();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      if (files.length + value.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} images allowed`);
        return;
      }

      // Process all files in parallel
      const uploadPromises = files.map(async (file) => {
        const fileId = safeRandomUUID();

        try {
          // Set initial progress
          setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

          // Create preview immediately
          const reader = new FileReader();
          reader.onload = (e) => {
            const newPreview = e.target?.result as string;
            setPreviews((prev) => [...prev, newPreview]);
          };
          reader.readAsDataURL(file);

          // Get presigned URL
          const mimetype = file.type as TFileUploadRequest['mimetype'];
          const response = await uploadMutation.mutateAsync(
            { mimetype, key: uploadKey },
            {
              onSuccess: () => {
                toast.success('Presigned URL obtained successfully');
              },
              onError: (error) => {
                console.error('Error getting presigned URL:', error);
                toast.error('Failed to get presigned URL');
              },
            }
          );

          const { filePath, uploadUrl } = response.data;

          // Upload file
          await axios.put(uploadUrl, file, {
            headers: {
              'Content-Type': file.type,
            },
            onUploadProgress: (progressEvent: AxiosProgressEvent) => {
              if (progressEvent.total) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setUploadProgress((prev) => ({ ...prev, [fileId]: percentCompleted }));
              }
            },
          });

          // Clean up progress
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });

          return filePath;
        } catch (error) {
          console.error('Error uploading file:', error);

          // Remove failed preview
          setPreviews((prev) => prev.slice(0, -1));
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });

          throw error;
        }
      });

      try {
        const uploadedPaths = await Promise.allSettled(uploadPromises);

        const successfulPaths = uploadedPaths
          .filter(
            (result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled'
          )
          .map((result) => result.value);
        const failedCount = uploadedPaths.length - successfulPaths.length;

        if (successfulPaths.length > 0) {
          onChange([...value, ...successfulPaths]);
          toast.success(`${successfulPaths.length} images uploaded successfully`);
        }

        if (failedCount > 0) {
          toast.error(`${failedCount} images failed to upload`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Some uploads failed');
      }
    },
    accept,
    multiple: true,
  });

  const handleRemove = (indexToRemove: number) => {
    const newImages = value.filter((_, index) => index !== indexToRemove);
    const newPreviews = previews.filter((_, index) => index !== indexToRemove);

    onChange(newImages);
    setPreviews(newPreviews);
  };

  const isUploading = Object.keys(uploadProgress).length > 0;

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="h-24 w-full rounded object-cover"
              />

              {/* Upload Progress Overlay */}
              {Object.values(uploadProgress).some((progress) => progress < 100) &&
                index >= value.length && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <div className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                      Uploading...
                    </div>
                  </div>
                )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="hover:text-destructive-foreground absolute -top-2 -right-2 rounded-full border border-border bg-background p-1 shadow transition-colors hover:bg-destructive"
                disabled={isUploading}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors duration-200 ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-border'
          } hover:border-primary hover:bg-primary/5 ${
            isUploading ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <input {...getInputProps()} disabled={isUploading} />
          <p className="text-center text-muted-foreground">
            {isDragActive
              ? 'Drop the images here...'
              : `Drag & drop images here, or click to select (${value.length}/${maxFiles})`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">Supports: JPG, PNG, WebP</p>
        </div>
      )}
    </div>
  );
};

export default MultipleImageDropzone;
