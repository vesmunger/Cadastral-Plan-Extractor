
import React, { useState, useRef, useCallback } from 'react';
import { UploadCloudIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      onFileSelect(file);
      setFileName(file.name);
    } else {
      alert('Please select a valid image (PNG, JPG, etc.) or PDF file.');
    }
  }, [onFileSelect]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200
        ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-300 dark:border-slate-600'}
        ${disabled ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-700' : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        className="hidden"
        accept="image/*,.pdf"
        disabled={disabled}
      />
      <div className="flex flex-col items-center justify-center space-y-2 text-slate-500 dark:text-slate-400">
        <UploadCloudIcon className="h-12 w-12" />
        {fileName ? (
           <p className="text-sm font-medium text-slate-700 dark:text-slate-300 break-all">{fileName}</p>
        ) : (
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Drag & Drop or <span className="text-blue-600 dark:text-blue-400">Browse</span>
            </p>
            <p className="text-xs">Supports: PDF, PNG, JPG</p>
          </div>
        )}
      </div>
    </div>
  );
};
