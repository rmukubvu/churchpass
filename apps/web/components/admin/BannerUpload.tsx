"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  currentUrl?: string;
  onUploaded: (url: string) => void;
};

export function BannerUpload({ currentUrl, onUploaded }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setError(null);
    setUploading(true);

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload/banner", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Upload failed (${res.status})`);
      }

      const { url } = await res.json();
      // Replace blob URL with the durable public URL
      setPreview(url);
      onUploaded(url);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
      // Keep the local preview so the user can see what they picked
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (f) uploadFile(f);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    onUploaded("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative w-full h-48 rounded-xl border-2 border-dashed transition-colors overflow-hidden cursor-pointer",
          dragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-white/10 bg-[#1a1a1a] hover:border-indigo-500/50"
        )}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Banner preview"
              className="w-full h-full object-cover"
            />
            {/* Dim overlay while uploading */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Spinner />
              </div>
            )}
            {/* Remove button */}
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors text-sm font-bold"
                aria-label="Remove banner"
              >
                ×
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 select-none pointer-events-none">
            {uploading ? (
              <Spinner />
            ) : (
              <>
                <UploadIcon />
                <p className="text-sm text-white/40">
                  Drag &amp; drop or{" "}
                  <span className="text-indigo-400">click to browse</span>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-6 h-6 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-8 h-8 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      <polyline points="16 8 12 4 8 8" />
      <line x1="12" y1="4" x2="12" y2="16" />
    </svg>
  );
}
