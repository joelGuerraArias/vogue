import React, { useRef } from 'react';
import { processFile } from '../utils';
import { FileData } from '../types';

interface UploadZoneProps {
  label: string;
  onFileSelect: (data: FileData) => void;
  selectedFile: FileData | null;
  icon: React.ReactNode;
  className?: string;
  compact?: boolean;
  onError?: (error: string) => void;
}

const UploadZoneComponent: React.FC<UploadZoneProps> = ({ label, onFileSelect, selectedFile, icon, className = "", compact = false, onError }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const data = await processFile(e.target.files[0]);
        onFileSelect(data);
      } catch (err: any) {
        console.error('File processing error:', err);
        if (onError) {
          onError(err.message || 'Failed to process image');
        }
      }
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        relative overflow-hidden border transition-all duration-300 cursor-pointer group
        ${selectedFile ? 'border-stone-900 bg-stone-50' : 'border-stone-300 hover:border-stone-800 bg-white hover:bg-stone-50'}
        flex flex-col items-center justify-center
        ${className}
      `}
    >
      <input 
        type="file" 
        accept="image/*" 
        ref={inputRef} 
        onChange={handleChange} 
        className="hidden" 
      />

      {selectedFile ? (
        <div className="absolute inset-0 w-full h-full bg-stone-100 flex items-center justify-center">
          <img 
            src={selectedFile.previewUrl} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity grayscale-[10%] group-hover:grayscale-0" 
          />
          <div className="absolute top-2 right-2 px-3 py-1 bg-white/90 text-stone-900 text-[10px] uppercase tracking-widest font-semibold backdrop-blur-sm rounded shadow-sm group-hover:bg-stone-900 group-hover:text-white transition-colors">
            Change
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-stone-400 group-hover:text-stone-900 transition-colors duration-500 p-4 text-center">
          <div className={`
            border border-stone-200 rounded-full group-hover:border-stone-900 group-hover:bg-stone-900 group-hover:text-white transition-all duration-500
            ${compact ? 'p-3 mb-2' : 'p-5 mb-4'}
          `}>
            {icon}
          </div>
          <span className={`font-serif italic ${compact ? 'text-lg' : 'text-2xl'} mb-1`}>{label}</span>
          {!compact && <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Click to Upload</span>}
        </div>
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const UploadZone = React.memo(UploadZoneComponent);