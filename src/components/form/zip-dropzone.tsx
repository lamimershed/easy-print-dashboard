import React, { useState } from 'react';
import { Accept, useDropzone } from 'react-dropzone';
import { Upload, FileArchive, X } from 'lucide-react';
import JSZip from 'jszip';

type ZipDropzoneProps = {
  onFilesExtracted: (files: { name: string; file: File; mimeType: string }[]) => void;
  onError: (error: string) => void;
};

export const ZipDropzone: React.FC<ZipDropzoneProps> = ({ onFilesExtracted, onError }) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedZip, setUploadedZip] = useState<string | null>(null);

  const extractZipFiles = async (zipFile: File) => {
    setIsExtracting(true);
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipFile);
      const imageFiles: { name: string; file: File; mimeType: string }[] = [];

      // Helper function to get MIME type from file extension
      const getMimeTypeFromExtension = (fileName: string): string => {
        const extension = fileName.toLowerCase().split('.').pop();
        const mimeTypes: { [key: string]: string } = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
        };
        return mimeTypes[extension || ''] || 'image/jpeg';
      };

      for (const fileName of Object.keys(zipContent.files)) {
        const file = zipContent.files[fileName];

        // Skip directories, Mac metadata files, and hidden files
        if (
          file.dir ||
          fileName.startsWith('__MACOSX/') ||
          fileName.includes('/._') ||
          fileName.startsWith('._')
        ) {
          continue;
        }

        // Check if it's an image file
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
          const blob = await file.async('blob');

          // Extract just the filename without the path
          const cleanFileName = fileName.split('/').pop() || fileName;

          // Get MIME type from file extension
          const mimeType = getMimeTypeFromExtension(cleanFileName);

          const imageFile = new File([blob], cleanFileName, { type: mimeType });
          imageFiles.push({ name: cleanFileName, file: imageFile, mimeType });
        }
      }

      if (imageFiles.length > 0) {
        setUploadedZip(zipFile.name);
        onFilesExtracted(imageFiles);
      } else {
        onError('No image files found in the ZIP archive.');
      }
    } catch (error) {
      console.error('ZIP extraction error:', error);
      onError("Failed to extract ZIP file. Please ensure it's a valid ZIP archive.");
    } finally {
      setIsExtracting(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (files?.[0]) {
        extractZipFiles(files[0]);
      }
    },
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
    } as Accept,
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedZip(null);
    onFilesExtracted([]);
  };

  return (
    <div
      {...getRootProps()}
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors duration-200 ${
        isDragActive ? 'border-primary bg-primary/10' : 'border-border'
      } hover:border-primary hover:bg-primary/5`}
    >
      <input {...getInputProps()} />

      {uploadedZip ? (
        <div className="flex items-center space-x-2">
          <FileArchive className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium text-foreground">{uploadedZip}</span>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          {isExtracting ? (
            <div className="text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Extracting images from ZIP...</p>
            </div>
          ) : (
            <>
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                {isDragActive
                  ? 'Drop the ZIP file here...'
                  : 'Drag & drop a ZIP file containing images, or click to select'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground/60">
                Supported formats: .zip (containing .jpg, .jpeg, .png, .gif, .webp)
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};
