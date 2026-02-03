"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Eye, Code, FileText, Monitor } from "lucide-react";
import MediaPreview from "./MediaPreview";

interface CardManifest {
  id: string;
  name: string;
  manifest: any;
  cardImageUrl: string | null;
  isActive: boolean;
}

interface CardManifestsEditorProps {
  siteId: string;
}

export default function CardManifestsEditor({ siteId }: CardManifestsEditorProps) {
  const [manifests, setManifests] = useState<CardManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"visual" | "json">("visual");
  const [newManifest, setNewManifest] = useState({
    name: "",
    manifest: {
      id: "",
      name: "",
      description: "",
      version: "1.0.0",
      dimensions: { width: 500, height: 700, thickness: 10 },
      faces: {
        front: { id: "front", name: "Front Face", layers: [] },
        back: { id: "back", name: "Back Face", layers: [] },
      },
      effects: {
        tilt: { enabled: true, maxAngle: 45 },
        layerEffects: { enabled: true },
      },
      interactions: {
        flipEnabled: true,
        clickToFlip: true,
      },
      metadata: {
        artist: "",
        series: "",
        rarity: "Limited",
        tags: [],
      },
    },
    cardImageUrl: "",
  });

  useEffect(() => {
    fetchManifests();
  }, [siteId]);

  const fetchManifests = async () => {
    try {
      setLoading(true);
      // TODO: Create API route for card manifests
      // const response = await fetch(`/api/sites/${siteId}/card-manifests`);
      // if (!response.ok) throw new Error("Failed to fetch manifests");
      // const data = await response.json();
      // setManifests(data);
      setManifests([]); // Placeholder
    } catch (error) {
      console.error("Error fetching manifests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // TODO: Implement save API
      alert("Card manifest save functionality coming soon");
      setShowAddForm(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving manifest:", error);
      alert("Failed to save manifest. Please try again.");
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">3D Card Manifests</h2>
          <p className="text-[#8A8A8A] text-sm">
            Configure 3D collectible card manifests for your campaign
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Card Manifest
        </button>
      </div>

      {showAddForm || editingId ? (
        <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl p-6">
          {/* Editor Mode Toggle */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#1A1A1A]">
            <button
              onClick={() => setEditorMode("visual")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                editorMode === "visual"
                  ? "bg-[#00A0FF] text-white"
                  : "bg-[#1A1A1A] text-[#CCCCCC] hover:bg-[#2A2A2A]"
              }`}
            >
              <FileText className="w-4 h-4" />
              Visual Editor
            </button>
            <button
              onClick={() => setEditorMode("json")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                editorMode === "json"
                  ? "bg-[#00A0FF] text-white"
                  : "bg-[#1A1A1A] text-[#CCCCCC] hover:bg-[#2A2A2A]"
              }`}
            >
              <Code className="w-4 h-4" />
              JSON Editor
            </button>
          </div>

          {/* Card Preview */}
          <div className="mb-6">
            <CardPreview
              manifest={newManifest.manifest}
              cardImageUrl={newManifest.cardImageUrl}
              cardName={newManifest.name}
            />
          </div>

          <div className="space-y-4 mb-6">
            {/* Basic Info - Always visible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                  Card Name
                </label>
                <input
                  type="text"
                  value={newManifest.name}
                  onChange={(e) => {
                    setNewManifest({
                      ...newManifest,
                      name: e.target.value,
                      manifest: {
                        ...newManifest.manifest,
                        name: e.target.value,
                        id: newManifest.manifest.id || e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      },
                    });
                  }}
                  className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
                  placeholder="Card Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={newManifest.manifest.version || "1.0.0"}
                  onChange={(e) =>
                    setNewManifest({
                      ...newManifest,
                      manifest: { ...newManifest.manifest, version: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
                  placeholder="1.0.0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                Description
              </label>
              <textarea
                value={newManifest.manifest.description || ""}
                onChange={(e) =>
                  setNewManifest({
                    ...newManifest,
                    manifest: { ...newManifest.manifest, description: e.target.value },
                  })
                }
                className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors min-h-[80px]"
                placeholder="Card description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                Card Preview Image URL
              </label>
              <input
                type="url"
                value={newManifest.cardImageUrl}
                onChange={(e) =>
                  setNewManifest({ ...newManifest, cardImageUrl: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
                placeholder="https://example.com/card-preview.png"
              />
              {newManifest.cardImageUrl && (
                <MediaPreview url={newManifest.cardImageUrl} type="image" />
              )}
            </div>

            {editorMode === "visual" ? (
              <VisualManifestEditor
                manifest={newManifest.manifest}
                onChange={(updatedManifest) =>
                  setNewManifest({ ...newManifest, manifest: updatedManifest })
                }
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                  Manifest JSON
                </label>
                <div className="bg-[#060606] border border-[#1A1A1A] rounded-lg p-4 max-h-96 overflow-auto">
                  <textarea
                    value={JSON.stringify(newManifest.manifest, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setNewManifest({ ...newManifest, manifest: parsed });
                      } catch (err) {
                        // Invalid JSON, but allow editing
                      }
                    }}
                    className="w-full h-full bg-transparent text-white font-mono text-sm focus:outline-none"
                    style={{ minHeight: "300px" }}
                  />
                </div>
                <p className="mt-2 text-xs text-[#8A8A8A]">
                  Edit the JSON manifest structure. Invalid JSON will be highlighted.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
            >
              Save Manifest
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
                setNewManifest({
                  name: "",
                  manifest: {
                    id: "",
                    name: "",
                    description: "",
                    version: "1.0.0",
                    dimensions: { width: 500, height: 700, thickness: 10 },
                    faces: {
                      front: { id: "front", name: "Front Face", layers: [] },
                      back: { id: "back", name: "Back Face", layers: [] },
                    },
                    effects: {
                      tilt: { enabled: true, maxAngle: 45 },
                      layerEffects: { enabled: true },
                    },
                    interactions: {
                      flipEnabled: true,
                      clickToFlip: true,
                    },
                    metadata: {
                      artist: "",
                      series: "",
                      rarity: "Limited",
                      tags: [],
                    },
                  },
                  cardImageUrl: "",
                });
              }}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#CCCCCC] font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {manifests.length === 0 ? (
        <div className="text-center py-12 bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl">
          <p className="text-[#8A8A8A] mb-4">No card manifests yet</p>
          <p className="text-sm text-[#6A6A6A]">
            Click "Add Card Manifest" to create your first 3D card
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {manifests.map((manifest) => (
            <div
              key={manifest.id}
              className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {manifest.name}
                  </h3>
                  <p className="text-sm text-[#8A8A8A]">
                    {manifest.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(manifest.id)}
                  className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {manifest.cardImageUrl && (
                <img
                  src={manifest.cardImageUrl}
                  alt={manifest.name}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}
              <button
                onClick={() => {
                  setEditingId(manifest.id);
                  setNewManifest({
                    name: manifest.name,
                    manifest: manifest.manifest,
                    cardImageUrl: manifest.cardImageUrl || "",
                  });
                }}
                className="w-full px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#CCCCCC] font-medium rounded-lg transition-colors"
              >
                Edit Manifest
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  function handleDelete(id: string) {
    // TODO: Implement delete
    alert("Delete functionality coming soon");
  }
}

interface VisualManifestEditorProps {
  manifest: any;
  onChange: (manifest: any) => void;
}

function VisualManifestEditor({ manifest, onChange }: VisualManifestEditorProps) {
  const updateManifest = (updates: any) => {
    onChange({ ...manifest, ...updates });
  };

  const updateDimensions = (updates: any) => {
    onChange({
      ...manifest,
      dimensions: { ...manifest.dimensions, ...updates },
    });
  };

  const updateEffects = (updates: any) => {
    onChange({
      ...manifest,
      effects: { ...manifest.effects, ...updates },
    });
  };

  const updateInteractions = (updates: any) => {
    onChange({
      ...manifest,
      interactions: { ...manifest.interactions, ...updates },
    });
  };

  const updateMetadata = (updates: any) => {
    onChange({
      ...manifest,
      metadata: { ...manifest.metadata, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      {/* Dimensions */}
      <div className="bg-[#060606] border border-[#1A1A1A] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Card Dimensions</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
              Width (px)
            </label>
            <input
              type="number"
              value={manifest.dimensions?.width || 500}
              onChange={(e) =>
                updateDimensions({ width: parseInt(e.target.value) || 500 })
              }
              className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:outline-none focus:border-[#00A0FF] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
              Height (px)
            </label>
            <input
              type="number"
              value={manifest.dimensions?.height || 700}
              onChange={(e) =>
                updateDimensions({ height: parseInt(e.target.value) || 700 })
              }
              className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:outline-none focus:border-[#00A0FF] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
              Thickness (px)
            </label>
            <input
              type="number"
              value={manifest.dimensions?.thickness || 10}
              onChange={(e) =>
                updateDimensions({ thickness: parseInt(e.target.value) || 10 })
              }
              className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:outline-none focus:border-[#00A0FF] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Effects */}
      <div className="bg-[#060606] border border-[#1A1A1A] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Effects</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-[#CCCCCC]">Enable Tilt Effect</label>
              <p className="text-xs text-[#8A8A8A]">Card tilts when hovering</p>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={manifest.effects?.tilt?.enabled ?? true}
                onChange={(e) =>
                  updateEffects({
                    tilt: { ...manifest.effects?.tilt, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 text-[#00A0FF] bg-[#060606] border-[#1A1A1A] rounded focus:ring-[#00A0FF]"
              />
            </label>
          </div>
          {manifest.effects?.tilt?.enabled && (
            <div>
              <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                Max Tilt Angle (degrees)
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={manifest.effects?.tilt?.maxAngle || 45}
                onChange={(e) =>
                  updateEffects({
                    tilt: { ...manifest.effects?.tilt, maxAngle: parseInt(e.target.value) || 45 },
                  })
                }
                className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:outline-none focus:border-[#00A0FF] transition-colors"
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-[#CCCCCC]">Enable Layer Effects</label>
              <p className="text-xs text-[#8A8A8A]">Additional visual effects on layers</p>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={manifest.effects?.layerEffects?.enabled ?? true}
                onChange={(e) =>
                  updateEffects({
                    layerEffects: { enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 text-[#00A0FF] bg-[#060606] border-[#1A1A1A] rounded focus:ring-[#00A0FF]"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Interactions */}
      <div className="bg-[#060606] border border-[#1A1A1A] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Interactions</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-[#CCCCCC]">Enable Flip</label>
              <p className="text-xs text-[#8A8A8A]">Allow card to flip</p>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={manifest.interactions?.flipEnabled ?? true}
                onChange={(e) =>
                  updateInteractions({ flipEnabled: e.target.checked })
                }
                className="w-4 h-4 text-[#00A0FF] bg-[#060606] border-[#1A1A1A] rounded focus:ring-[#00A0FF]"
              />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-[#CCCCCC]">Click to Flip</label>
              <p className="text-xs text-[#8A8A8A]">Flip card on click</p>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={manifest.interactions?.clickToFlip ?? true}
                onChange={(e) =>
                  updateInteractions({ clickToFlip: e.target.checked })
                }
                className="w-4 h-4 text-[#00A0FF] bg-[#060606] border-[#1A1A1A] rounded focus:ring-[#00A0FF]"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-[#060606] border border-[#1A1A1A] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
              Artist
            </label>
            <input
              type="text"
              value={manifest.metadata?.artist || ""}
              onChange={(e) =>
                updateMetadata({ artist: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
              placeholder="Artist name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
              Series
            </label>
            <input
              type="text"
              value={manifest.metadata?.series || ""}
              onChange={(e) =>
                updateMetadata({ series: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
              placeholder="Series name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
              Rarity
            </label>
            <select
              value={manifest.metadata?.rarity || "Limited"}
              onChange={(e) =>
                updateMetadata({ rarity: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:outline-none focus:border-[#00A0FF] transition-colors"
            >
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Epic">Epic</option>
              <option value="Legendary">Legendary</option>
              <option value="Limited">Limited</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={Array.isArray(manifest.metadata?.tags) ? manifest.metadata.tags.join(", ") : ""}
              onChange={(e) => {
                const tags = e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter((t) => t.length > 0);
                updateMetadata({ tags });
              }}
              className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
              placeholder="tag1, tag2, tag3"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface CardPreviewProps {
  manifest: any;
  cardImageUrl: string;
  cardName: string;
}

function CardPreview({ manifest, cardImageUrl, cardName }: CardPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const dimensions = manifest.dimensions || { width: 500, height: 700, thickness: 10 };
  const effects = manifest.effects || {};
  const interactions = manifest.interactions || {};
  const metadata = manifest.metadata || {};

  // Calculate aspect ratio for display
  const aspectRatio = dimensions.height / dimensions.width;
  const displayWidth = 280;
  const displayHeight = displayWidth * aspectRatio;

  // Tilt effect calculation
  const tiltEnabled = effects.tilt?.enabled ?? true;
  const maxAngle = effects.tilt?.maxAngle || 45;
  const tiltAngle = isHovered && tiltEnabled ? maxAngle : 0;

  // Flip interaction
  const flipEnabled = interactions.flipEnabled ?? true;
  const clickToFlip = interactions.clickToFlip ?? true;

  const rarityColors: Record<string, string> = {
    Common: "#9CA3AF",
    Uncommon: "#10B981",
    Rare: "#3B82F6",
    Epic: "#8B5CF6",
    Legendary: "#F59E0B",
    Limited: "#EF4444",
  };

  return (
    <div className="bg-[#060606] border border-[#1A1A1A] rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Monitor className="w-5 h-5 text-[#00A0FF]" />
        <h3 className="text-lg font-semibold text-white">Live Preview</h3>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Card Preview */}
        <div className="flex-1 flex justify-center items-start">
          <div
            className="relative"
            style={{
              perspective: "1000px",
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
              if (flipEnabled && clickToFlip) {
                setIsFlipped(!isFlipped);
              }
            }}
          >
            <div
              className="relative w-full h-full transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front Face */}
              <div
                className="absolute inset-0 rounded-lg border-2 overflow-hidden shadow-lg cursor-pointer"
                style={{
                  transform: `rotateY(0deg) rotateX(${tiltAngle * 0.1}deg) rotateZ(${tiltAngle * 0.05}deg)`,
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                  borderColor: tiltEnabled && isHovered ? "#00A0FF" : "#333333",
                  transition: "all 0.3s ease",
                }}
              >
                {cardImageUrl ? (
                  <img
                    src={cardImageUrl}
                    alt={cardName || "Card Preview"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] flex flex-col items-center justify-center p-6"
                    style={{
                      width: `${dimensions.width}px`,
                      height: `${dimensions.height}px`,
                    }}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4">🃏</div>
                      <h4 className="text-white font-bold text-xl mb-2">
                        {cardName || "Card Preview"}
                      </h4>
                      <p className="text-[#8A8A8A] text-sm">
                        {dimensions.width} × {dimensions.height}px
                      </p>
                      {manifest.description && (
                        <p className="text-[#CCCCCC] text-sm mt-4">
                          {manifest.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {/* Thickness effect */}
                {dimensions.thickness > 0 && (
                  <div
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 ${dimensions.thickness}px rgba(0, 160, 255, 0.1)`,
                    }}
                  />
                )}
              </div>

              {/* Back Face */}
              {flipEnabled && (
                <div
                  className="absolute inset-0 rounded-lg border-2 overflow-hidden shadow-lg cursor-pointer"
                  style={{
                    transform: "rotateY(180deg)",
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                    borderColor: "#333333",
                  }}
                >
                  <div
                    className="w-full h-full bg-gradient-to-br from-[#060606] to-[#1A1A1A] flex flex-col items-center justify-center p-6"
                    style={{
                      width: `${dimensions.width}px`,
                      height: `${dimensions.height}px`,
                    }}
                  >
                    <div className="text-center">
                      <div className="text-6xl mb-4">✨</div>
                      <h4 className="text-white font-bold text-xl mb-2">Card Back</h4>
                      <p className="text-[#8A8A8A] text-sm">
                        {manifest.name || cardName || "Card"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Info Panel */}
        <div className="flex-1 space-y-4">
          <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-[#CCCCCC] mb-3">Card Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8A8A8A]">Name:</span>
                <span className="text-white font-medium">{manifest.name || cardName || "Untitled"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8A8A]">Version:</span>
                <span className="text-white">{manifest.version || "1.0.0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8A8A]">Dimensions:</span>
                <span className="text-white">
                  {dimensions.width} × {dimensions.height} × {dimensions.thickness}px
                </span>
              </div>
              {metadata.rarity && (
                <div className="flex justify-between items-center">
                  <span className="text-[#8A8A8A]">Rarity:</span>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: `${rarityColors[metadata.rarity] || "#9CA3AF"}20`,
                      color: rarityColors[metadata.rarity] || "#9CA3AF",
                    }}
                  >
                    {metadata.rarity}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-[#CCCCCC] mb-3">Effects & Interactions</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#8A8A8A]">Tilt Effect:</span>
                <span className={tiltEnabled ? "text-green-400" : "text-[#8A8A8A]"}>
                  {tiltEnabled ? `✓ Enabled (${maxAngle}°)` : "✗ Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8A8A8A]">Layer Effects:</span>
                <span className={effects.layerEffects?.enabled ? "text-green-400" : "text-[#8A8A8A]"}>
                  {effects.layerEffects?.enabled ? "✓ Enabled" : "✗ Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8A8A8A]">Flip Enabled:</span>
                <span className={flipEnabled ? "text-green-400" : "text-[#8A8A8A]"}>
                  {flipEnabled ? "✓ Enabled" : "✗ Disabled"}
                </span>
              </div>
              {flipEnabled && (
                <div className="flex items-center justify-between">
                  <span className="text-[#8A8A8A]">Click to Flip:</span>
                  <span className={clickToFlip ? "text-green-400" : "text-[#8A8A8A]"}>
                    {clickToFlip ? "✓ Enabled" : "✗ Disabled"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {Object.keys(metadata).length > 0 && (metadata.artist || metadata.series || metadata.tags?.length > 0) && (
            <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg p-4">
              <h4 className="text-sm font-semibold text-[#CCCCCC] mb-3">Metadata</h4>
              <div className="space-y-2 text-sm">
                {metadata.artist && (
                  <div>
                    <span className="text-[#8A8A8A]">Artist: </span>
                    <span className="text-white">{metadata.artist}</span>
                  </div>
                )}
                {metadata.series && (
                  <div>
                    <span className="text-[#8A8A8A]">Series: </span>
                    <span className="text-white">{metadata.series}</span>
                  </div>
                )}
                {metadata.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0 && (
                  <div>
                    <span className="text-[#8A8A8A]">Tags: </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {metadata.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-[#1A1A1A] text-[#CCCCCC] rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-[#8A8A8A] pt-2 border-t border-[#1A1A1A]">
            {tiltEnabled && <p>• Hover to see tilt effect</p>}
            {flipEnabled && clickToFlip && <p>• Click to flip card</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
