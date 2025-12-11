
'use client';

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageUploadProps {
  value?: File | string;
  onChange: (value: File | string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({ value, onChange, disabled, className }: ImageUploadProps) {

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    onChange(file);
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: disabled
  });

  const removeImage = () => {
    onChange(null);
  };

  if (value) {
    const src = value instanceof File ? URL.createObjectURL(value) : value;
    return (
      <div className={cn("relative group", className)}>
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={src}
            alt="Uploaded image"
            fill
            className="object-cover"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-muted-foreground rounded-lg p-6 text-center cursor-pointer transition-colors",
        isDragActive && "border-blue-500 bg-blue-50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center gap-2">
        <ImageIcon className="h-8 w-8 text-gray-400" />

        <div className="text-sm">
          {isDragActive ? (
            <span className="text-blue-600">Drop image here</span>
          ) : (
            <span className="text-muted-foreground">
              Drop image here or <span className="text-blue-600 underline">browse</span>
            </span>
          )}
        </div>
        
        <p className="text-xs text-gray-500">
          PNG, JPG, GIF, WebP up to 10MB
        </p>
      </div>
    </div>
  );
}
