"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon, Video, File, Trash2, Loader2, X, CheckSquare, Square } from "lucide-react";
import MediaPreview from "./MediaPreview";

interface Asset {
  id: string;
  type: "image" | "video" | "audio" | "document";
  url: string;
  filename: string;
  mimeType: string | null;
  size: number | null;
  uploadedAt: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

interface AssetsManagerProps {
  siteId: string;
}

export default function AssetsManager({ siteId }: AssetsManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [siteId]);

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
      // Initialize upload tracking for all files
      const newUploads = new Map<string, UploadingFile>();
      acceptedFiles.forEach((file) => {
        const uploadId = `${file.name}-${Date.now()}-${Math.random()}`;
        newUploads.set(uploadId, {
          id: uploadId,
          file,
          progress: 0,
          status: "uploading",
        });
      });
      setUploadingFiles((prev) => new Map([...prev, ...newUploads]));

      // Upload each file independently
      acceptedFiles.forEach(async (file) => {
        const uploadId = Array.from(newUploads.keys()).find(
          (id) => newUploads.get(id)?.file === file
        )!;

        try {
          const formData = new FormData();
          formData.append("file", file);

          // Use XMLHttpRequest for progress tracking
          const xhr = new XMLHttpRequest();

          // Track upload progress
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setUploadingFiles((prev) => {
                const updated = new Map(prev);
                const current = updated.get(uploadId);
                if (current) {
                  updated.set(uploadId, { ...current, progress });
                }
                return updated;
              });
            }
          });

          // Handle completion
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const newAsset = JSON.parse(xhr.responseText);
                setAssets((prev) => [...prev, newAsset]);
                setUploadingFiles((prev) => {
                  const updated = new Map(prev);
                  const current = updated.get(uploadId);
                  if (current) {
                    updated.set(uploadId, { ...current, progress: 100, status: "success" });
                  }
                  return updated;
                });

                // Remove from uploading list after a delay
                setTimeout(() => {
                  setUploadingFiles((prev) => {
                    const updated = new Map(prev);
                    updated.delete(uploadId);
                    return updated;
                  });
                }, 2000);
              } catch (error) {
                console.error("Error parsing response:", error);
                setUploadingFiles((prev) => {
                  const updated = new Map(prev);
                  const current = updated.get(uploadId);
                  if (current) {
                    updated.set(uploadId, {
                      ...current,
                      status: "error",
                      error: "Failed to parse server response",
                    });
                  }
                  return updated;
                });
              }
            } else {
              setUploadingFiles((prev) => {
                const updated = new Map(prev);
                const current = updated.get(uploadId);
                if (current) {
                  updated.set(uploadId, {
                    ...current,
                    status: "error",
                    error: `Upload failed: ${xhr.statusText}`,
                  });
                }
                return updated;
              });
            }
          });

          // Handle errors
          xhr.addEventListener("error", () => {
            setUploadingFiles((prev) => {
              const updated = new Map(prev);
              const current = updated.get(uploadId);
              if (current) {
                updated.set(uploadId, {
                  ...current,
                  status: "error",
                  error: "Network error occurred",
                });
              }
              return updated;
            });
          });

          xhr.open("POST", `/api/sites/${siteId}/assets`);
          xhr.send(formData);
        } catch (error) {
          console.error("Error uploading file:", error);
          setUploadingFiles((prev) => {
            const updated = new Map(prev);
            const current = updated.get(uploadId);
            if (current) {
              updated.set(uploadId, {
                ...current,
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            return updated;
          });
        }
      });
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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

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

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAssets.size === assets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(assets.map((a) => a.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.size === 0) return;

    const count = selectedAssets.size;
    if (!confirm(`Are you sure you want to delete ${count} asset${count > 1 ? "s" : ""}?`)) {
      return;
    }

    setIsDeleting(true);
    const assetIds = Array.from(selectedAssets);
    const deletePromises = assetIds.map((assetId) =>
      fetch(`/api/sites/${siteId}/assets/${assetId}`, {
        method: "DELETE",
      })
    );

    try {
      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok));

      if (failed.length > 0) {
        alert(`Failed to delete ${failed.length} asset${failed.length > 1 ? "s" : ""}. Please try again.`);
      }

      // Remove successfully deleted assets from state
      setAssets((prev) => prev.filter((a) => !selectedAssets.has(a.id)));
      setSelectedAssets(new Set());
    } catch (error) {
      console.error("Error deleting assets:", error);
      alert("Failed to delete assets. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSingleDelete = async (asset: Asset) => {
    if (!confirm(`Are you sure you want to delete "${asset.filename}"?`)) return;

    try {
      const response = await fetch(`/api/sites/${siteId}/assets/${asset.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete asset");
      }

      // Remove from local state
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      // Remove from selection if it was selected
      setSelectedAssets((prev) => {
        const newSet = new Set(prev);
        newSet.delete(asset.id);
        return newSet;
      });
    } catch (error) {
      console.error("Error deleting asset:", error);
      alert(error instanceof Error ? error.message : "Failed to delete asset. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#00A0FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Assets</h2>
        <p className="text-[#8A8A8A] text-sm mb-6">
          Upload images, videos, and other media files for your campaign site
        </p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-[#00A0FF] bg-[#00A0FF]/10"
            : "border-[#1A1A1A] hover:border-[#2A2A2A]"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <Upload className="w-12 h-12 text-[#8A8A8A]" />
          <div>
            <p className="text-[#CCCCCC] font-medium">
              {isDragActive
                ? "Drop files here"
                : "Drag & drop files here, or click to select"}
            </p>
            <p className="text-[#8A8A8A] text-sm mt-2">
              Supports images, videos, and audio files
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress List */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Uploading Files</h3>
          {Array.from(uploadingFiles.values()).map((upload) => (
            <div
              key={upload.id}
              className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getAssetIcon(
                    upload.file.type.startsWith("image/")
                      ? "image"
                      : upload.file.type.startsWith("video/")
                      ? "video"
                      : upload.file.type.startsWith("audio/")
                      ? "audio"
                      : "document"
                  )}
                  <p className="text-sm text-[#CCCCCC] truncate">{upload.file.name}</p>
                  <span className="text-xs text-[#8A8A8A]">
                    ({formatFileSize(upload.file.size)})
                  </span>
                </div>
                {upload.status === "success" && (
                  <span className="text-xs text-green-400 font-medium">✓ Complete</span>
                )}
                {upload.status === "error" && (
                  <span className="text-xs text-red-400 font-medium">✗ Failed</span>
                )}
                {upload.status === "uploading" && (
                  <span className="text-xs text-[#00A0FF] font-medium">
                    {upload.progress}%
                  </span>
                )}
              </div>
              {upload.status === "uploading" && (
                <div className="w-full bg-[#060606] rounded-full h-2">
                  <div
                    className="bg-[#00A0FF] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              {upload.status === "error" && upload.error && (
                <p className="text-xs text-red-400 mt-2">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selection Controls */}
      {assets.length > 0 && (
        <div className="flex items-center justify-between bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-[#CCCCCC] hover:text-white transition-colors"
            >
              {selectedAssets.size === assets.length ? (
                <CheckSquare className="w-5 h-5 text-[#00A0FF]" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {selectedAssets.size === 0
                  ? "Select All"
                  : `${selectedAssets.size} of ${assets.length} selected`}
              </span>
            </button>
          </div>
          {selectedAssets.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedAssets.size})</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Assets Grid */}
      {assets.length === 0 ? (
        <div className="text-center py-12 bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl">
          <p className="text-[#8A8A8A]">No assets uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={`group relative bg-[#0F0F0F] border rounded-lg overflow-hidden transition-colors ${
                selectedAssets.has(asset.id)
                  ? "border-[#00A0FF] ring-2 ring-[#00A0FF]/50"
                  : "border-[#1A1A1A] hover:border-[#00A0FF]"
              }`}
            >
              {/* Selection Checkbox */}
              <div
                className="absolute top-2 left-2 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAssetSelection(asset.id);
                }}
              >
                <button
                  className={`p-1.5 rounded bg-black/70 hover:bg-black/90 transition-colors ${
                    selectedAssets.has(asset.id) ? "text-[#00A0FF]" : "text-white"
                  }`}
                >
                  {selectedAssets.has(asset.id) ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Asset Preview */}
              <div
                className="cursor-pointer"
                onClick={() => {
                  if (asset.type === "image" || asset.type === "video" || asset.type === "audio") {
                    setPreviewAsset(asset);
                  }
                }}
              >
              {asset.type === "image" ? (
                <img
                  src={asset.url}
                  alt={asset.filename}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-[#060606] flex items-center justify-center">
                  {getAssetIcon(asset.type)}
                </div>
              )}
                <div className="p-3">
                  <p className="text-sm text-[#CCCCCC] truncate mb-1">
                    {asset.filename}
                  </p>
                  <p className="text-xs text-[#8A8A8A]">
                    {formatFileSize(asset.size)}
                  </p>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(asset.url);
                    alert("URL copied to clipboard!");
                  }}
                  className="p-2 bg-[#00A0FF]/80 hover:bg-[#00A0FF] text-white rounded"
                  title="Copy URL"
                >
                  <File className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSingleDelete(asset);
                  }}
                  className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewAsset(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewAsset(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{previewAsset.filename}</h3>
              <MediaPreview
                url={previewAsset.url}
                type={previewAsset.type as "image" | "video" | "audio"}
                onClose={() => setPreviewAsset(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
