'use client';

import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, Image as ImageIcon, Check } from 'lucide-react';

export function PremiumProfileUpload({
  initialImageUrl,
  onSave,
  onCancel,
}: {
  initialImageUrl?: string;
  onSave?: (file: File) => void;
  onCancel?: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsSaved(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSave = () => {
    if (selectedFile && onSave) {
      onSave(selectedFile);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="w-full max-w-[420px] bg-white rounded-[20px] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100 text-center flex flex-col items-center">
      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
        Upload Profile Photo
      </h3>
      <p className="text-xs text-slate-500 mt-1 mb-6">
        PNG, JPG or GIF (max. 5MB)
      </p>

      {/* Avatar Container with Camera Badge */}
      <div className="relative w-[110px] h-[110px] mx-auto mb-6">
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] bg-slate-100 flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="User Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-extrabold text-2xl text-slate-400">AS</span>
          )}
        </div>

        {/* Camera Badge Overlay */}
        <label
          htmlFor="profile-input-hidden"
          className="absolute bottom-0.5 right-0.5 w-[34px] h-[34px] rounded-full bg-[#2580ef] hover:bg-[#1d6fd6] text-white flex items-center justify-center cursor-pointer border-[3px] border-white shadow-[0_4px_10px_rgba(37,128,239,0.35)] hover:scale-110 active:scale-95 transition-transform"
          title="Change Photo"
        >
          <Camera className="w-4 h-4" />
        </label>
        <input
          ref={fileInputRef}
          type="file"
          id="profile-input-hidden"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Drag & Drop Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 mb-6 ${
          isDragging
            ? 'border-[#2580ef] bg-blue-50/50'
            : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        <div className="p-2.5 rounded-full bg-blue-50 text-[#2580ef]">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-xs text-slate-600 font-medium mt-1">
          <span className="font-bold text-[#2580ef] underline">Click to upload</span> or drag and drop
        </p>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2580ef] to-[#0056b3] text-white font-semibold text-xs shadow-[0_4px_14px_rgba(37,128,239,0.35)] hover:shadow-[0_6px_20px_rgba(37,128,239,0.45)] hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-1.5"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Saved!</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </div>
  );
}
