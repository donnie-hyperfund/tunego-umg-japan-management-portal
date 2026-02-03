"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Image as ImageIcon, Video, File, Upload, Loader2, Search, Check } from "lucide-react";
import { put } from "@vercel/blob/client";

interface Asset {
  id: string;
  type: "image" | "video" | "audio" | "document";
  url: string;
  filename: string;
  mimeType: string | null;
  size: number | null;
  uploadedAt: string;
}

interface AssetPickerProps {
  siteId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assetUrl: string) => void;
  filterType?: "image" | "video" | "audio" | "document" | "all";
  title?: string;
}

export default function AssetPicker({
  siteId,
  isOpen,
  onClose,
  onSelect,
  filterType = "all",
  title = "Select Asset",
}: AssetPickerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "image" | "video" | "audio" | "document">(
    filterType === "all" ? "all" : filterType
  );
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { file: File; progress: number; error?: string }>>(new Map());

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [siteId, isOpen]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sites/${siteId}/assets`);
      if (!response.ok) throw new Error("Failed to fetch assets");
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newUploads = new Map<string, { file: File; progress: number; error?: string }>();
      acceptedFiles.forEach((file) => {
        const uploadId = `${file.name}-${Date.now()}-${Math.random()}`;
        newUploads.set(uploadId, { file, progress: 0 });
      });
      setUploadingFiles((prev) => new Map([...prev, ...newUploads]));

      // Upload each file using direct Vercel Blob upload
      for (const file of acceptedFiles) {
        const uploadId = Array.from(newUploads.keys()).find(
          (id) => newUploads.get(id)?.file === file
        )!;

        try {
          // Step 1: Get upload token
          const tokenResponse = await fetch(`/api/sites/${siteId}/assets/upload-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
            }),
          });

          if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to get upload token: ${tokenResponse.status}`);
          }

          const { token } = await tokenResponse.json();

          // Step 2: Upload directly to Vercel Blob using the client SDK
          setUploadingFiles((prev) => {
            const updated = new Map(prev);
            const current = updated.get(uploadId);
            if (current) {
              updated.set(uploadId, { ...current, progress: 50 });
            }
            return updated;
          });

          // Upload directly to Vercel Blob (bypasses Next.js body parsing)
          const blob = await put(`sites/${siteId}/${file.name}`, file, {
            access: 'public',
            token: token,
            // Note: Vercel Blob client doesn't support progress callbacks
            // Progress is shown via the initial 50% state
          });

          // Step 3: Save to database via our API
          const saveResponse = await fetch(`/api/sites/${siteId}/assets/upload-complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: blob.url,
              filename: file.name,
              contentType: file.type,
            }),
          });

          if (!saveResponse.ok) {
            const errorData = await saveResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to save asset record');
          }

          const newAsset = await saveResponse.json();
          setAssets((prev) => [...prev, newAsset]);
          setUploadingFiles((prev) => {
            const updated = new Map(prev);
            updated.delete(uploadId);
            return updated;
          });
        } catch (error: any) {
          console.error("Error uploading file:", error);
          setUploadingFiles((prev) => {
            const updated = new Map(prev);
            const current = updated.get(uploadId);
            if (current) {
              updated.set(uploadId, {
                ...current,
                progress: 0,
                error: error?.message || "Failed to upload file",
              });
            }
            return updated;
          });
        }
      }
    },
    [siteId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".webm", ".mov"],
      "audio/*": [".mp3", ".wav", ".ogg"],
    },
  });

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesType = selectedType === "all" || asset.type === selectedType;
    const matchesSearch =
      searchQuery === "" ||
      asset.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleSelect = (asset: Asset) => {
    onSelect(asset.url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1A1A1A]">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors text-[#8A8A8A] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b border-[#1A1A1A] space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full pl-10 pr-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "image", "video", "audio"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    selectedType === type
                      ? "bg-[#00A0FF] text-white"
                      : "bg-[#1A1A1A] text-[#CCCCCC] hover:bg-[#2A2A2A]"
                  }`}
                >
                  {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-[#00A0FF] bg-[#00A0FF]/10"
                : "border-[#1A1A1A] hover:border-[#2A2A2A]"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex items-center justify-center gap-2 text-sm text-[#CCCCCC]">
              <Upload className="w-4 h-4" />
              <span>
                {isDragActive
                  ? "Drop files here"
                  : "Drag & drop files here, or click to upload"}
              </span>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadingFiles.size > 0 && (
            <div className="space-y-2">
              {Array.from(uploadingFiles.entries()).map(([id, upload]) => (
                <div
                  key={id}
                  className={`bg-[#060606] border rounded-lg p-2 ${
                    upload.error ? "border-red-500/50" : "border-[#1A1A1A]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#CCCCCC] truncate flex-1">
                      {upload.file.name}
                    </span>
                    {upload.error ? (
                      <span className="text-xs text-red-400 ml-2">Error</span>
                    ) : (
                      <span className="text-xs text-[#00A0FF] ml-2">
                        {upload.progress}%
                      </span>
                    )}
                  </div>
                  {upload.error ? (
                    <div className="mt-1">
                      <p className="text-xs text-red-400">{upload.error}</p>
                      <button
                        onClick={() => {
                          setUploadingFiles((prev) => {
                            const updated = new Map(prev);
                            updated.delete(id);
                            return updated;
                          });
                        }}
                        className="mt-1 text-xs text-[#8A8A8A] hover:text-white"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <div className="w-full bg-[#1A1A1A] rounded-full h-1.5">
                      <div
                        className="bg-[#00A0FF] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assets Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#00A0FF] animate-spin" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#8A8A8A] mb-2">
                {searchQuery || selectedType !== "all"
                  ? "No assets found matching your criteria"
                  : "No assets uploaded yet"}
              </p>
              <p className="text-sm text-[#6A6A6A]">
                Upload files using the area above
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => handleSelect(asset)}
                  className="group relative bg-[#060606] border border-[#1A1A1A] rounded-lg overflow-hidden cursor-pointer hover:border-[#00A0FF] transition-colors"
                >
                  {asset.type === "image" ? (
                    <div className="relative aspect-square">
                      <img
                        src={asset.url}
                        alt={asset.filename}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Check className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-[#060606] flex items-center justify-center">
                      {getAssetIcon(asset.type)}
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-[#CCCCCC] truncate mb-1">
                      {asset.filename}
                    </p>
                    <p className="text-xs text-[#8A8A8A]">
                      {formatFileSize(asset.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
