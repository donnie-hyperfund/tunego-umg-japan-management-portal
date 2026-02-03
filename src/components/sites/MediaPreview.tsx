"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface MediaPreviewProps {
  url: string;
  type: "image" | "video" | "audio";
  onClose?: () => void;
  className?: string;
}

export default function MediaPreview({ url, type, onClose, className = "" }: MediaPreviewProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!url) return null;

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  if (!isValidUrl(url)) {
    return (
      <div className={`mt-2 p-3 bg-[#1A1A1A] border border-red-500/50 rounded-lg ${className}`}>
        <p className="text-sm text-red-400">Invalid URL format</p>
      </div>
    );
  }

  return (
    <div className={`mt-4 relative ${className}`}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-1 bg-black/70 hover:bg-black/90 rounded-full text-white transition-colors"
          title="Close preview"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg p-4">
        <p className="text-sm text-[#CCCCCC] mb-3">Preview:</p>
        
        {type === "image" && (
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#060606] rounded">
                <div className="w-8 h-8 border-2 border-[#00A0FF] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={url}
              alt="Preview"
              className={`max-w-full max-h-[400px] mx-auto border border-[#1A1A1A] rounded-lg object-contain ${
                error ? "hidden" : ""
              }`}
              onLoad={() => setLoading(false)}
              onError={() => {
                setError(true);
                setLoading(false);
              }}
            />
            {error && (
              <div className="p-4 bg-[#1A1A1A] border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-400 text-center">
                  Failed to load image. Please check the URL.
                </p>
              </div>
            )}
          </div>
        )}

        {type === "video" && (
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#060606] rounded z-10">
                <div className="w-8 h-8 border-2 border-[#00A0FF] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <video
              src={url}
              controls
              className={`w-full max-h-[400px] border border-[#1A1A1A] rounded-lg ${
                error ? "hidden" : ""
              }`}
              onLoadedData={() => setLoading(false)}
              onError={() => {
                setError(true);
                setLoading(false);
              }}
            >
              Your browser does not support the video tag.
            </video>
            {error && (
              <div className="p-4 bg-[#1A1A1A] border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-400 text-center">
                  Failed to load video. Please check the URL and format (MP4, WebM, etc.).
                </p>
              </div>
            )}
          </div>
        )}

        {type === "audio" && (
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#060606] rounded z-10">
                <div className="w-8 h-8 border-2 border-[#00A0FF] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <audio
              src={url}
              controls
              className={`w-full ${error ? "hidden" : ""}`}
              onLoadedData={() => setLoading(false)}
              onError={() => {
                setError(true);
                setLoading(false);
              }}
            >
              Your browser does not support the audio tag.
            </audio>
            {error && (
              <div className="p-4 bg-[#1A1A1A] border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-400 text-center">
                  Failed to load audio. Please check the URL and format (MP3, WAV, etc.).
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
