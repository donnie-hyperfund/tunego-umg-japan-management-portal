"use client";

import { useState, useEffect } from "react";
import { Plus, GripVertical, Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import HeroEditor from "./HeroEditor";
import MediaPreview from "./MediaPreview";

interface SiteContent {
  id: string;
  section: string;
  contentType: string;
  content: any;
  order: number;
  isVisible: boolean;
}

interface ContentEditorProps {
  siteId: string;
}

export default function ContentEditor({ siteId }: ContentEditorProps) {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSection, setNewSection] = useState({
    section: "hero",
    contentType: "hero",
  });

  useEffect(() => {
    fetchContent();
  }, [siteId]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sites/${siteId}/content`);
      if (!response.ok) throw new Error("Failed to fetch content");
      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: newSection.section,
          contentType: newSection.contentType,
          content: getDefaultContent(newSection.contentType),
          order: content.length,
        }),
      });

      if (!response.ok) throw new Error("Failed to create section");
      const newContent = await response.json();
      setContent([...content, newContent]);
      setShowAddSection(false);
      const defaultTypes = getContentTypesForSection("hero");
      setNewSection({ section: "hero", contentType: defaultTypes[0] || "hero" });
    } catch (error) {
      console.error("Error adding section:", error);
      alert("Failed to add section. Please try again.");
    }
  };

  const handleUpdateContent = async (contentId: string, updates: Partial<SiteContent>) => {
    try {
      const response = await fetch(`/api/sites/${siteId}/content/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update content");
      const updated = await response.json();
      setContent(content.map((c) => (c.id === contentId ? updated : c)));
    } catch (error) {
      console.error("Error updating content:", error);
      alert("Failed to update content. Please try again.");
    }
  };

  const handleDeleteSection = async (contentId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    try {
      const response = await fetch(`/api/sites/${siteId}/content/${contentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete section");
      setContent(content.filter((c) => c.id !== contentId));
    } catch (error) {
      console.error("Error deleting section:", error);
      alert("Failed to delete section. Please try again.");
    }
  };

  const handleToggleVisibility = async (contentId: string, isVisible: boolean) => {
    await handleUpdateContent(contentId, { isVisible: !isVisible });
  };

  const getDefaultContent = (contentType: string) => {
    switch (contentType) {
      case "hero":
        return { title: "", subtitle: "", backgroundVideo: "", backgroundImage: "", ctaText: "", ctaLink: "" };
      case "text":
        return { text: "" };
      case "richText":
        return { html: "" };
      case "image":
        return { url: "", alt: "" };
      case "video":
        return { url: "", autoplay: true, loop: true };
      case "cardManifest":
        return { cardImageUrl: "" };
      case "signup":
        return { enabled: true, placeholder: "メールアドレスを入力", buttonText: "登録" };
      default:
        return {};
    }
  };

  const getContentTypesForSection = (section: string): string[] => {
    switch (section) {
      case "hero":
        return ["hero"];
      case "description":
        return ["richText", "text"];
      case "cards":
        return ["cardManifest"];
      case "signup":
        return ["signup"];
      default:
        return ["text", "richText", "image", "video"];
    }
  };

  const renderContentEditor = (item: SiteContent) => {
    // Handle hero section - support both "hero" and legacy "text" content types
    if (item.section === "hero" && (item.contentType === "hero" || item.contentType === "text")) {
      return (
        <HeroEditor
          content={item.content || {}}
          onChange={(newContent) =>
            handleUpdateContent(item.id, { content: newContent })
          }
        />
      );
    }

    switch (item.contentType) {
      case "richText":
        return (
          <RichTextEditor
            value={item.content?.html || ""}
            onChange={(html) =>
              handleUpdateContent(item.id, { content: { html } })
            }
          />
        );
      case "text":
        return (
          <textarea
            value={item.content?.text || ""}
            onChange={(e) =>
              handleUpdateContent(item.id, {
                content: { text: e.target.value },
              })
            }
            className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors min-h-[200px]"
            placeholder="Enter text content..."
          />
        );
      case "image":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={item.content?.url || ""}
                onChange={(e) =>
                  handleUpdateContent(item.id, {
                    content: { ...item.content, url: e.target.value },
                  })
                }
                className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                Alt Text
              </label>
              <input
                type="text"
                value={item.content?.alt || ""}
                onChange={(e) =>
                  handleUpdateContent(item.id, {
                    content: { ...item.content, alt: e.target.value },
                  })
                }
                className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
                placeholder="Image description"
              />
            </div>
            {item.content?.url && (
              <MediaPreview url={item.content.url} type="image" />
            )}
          </div>
        );
      case "video":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                Video URL
              </label>
              <input
                type="url"
                value={item.content?.url || ""}
                onChange={(e) =>
                  handleUpdateContent(item.id, {
                    content: { ...item.content, url: e.target.value },
                  })
                }
                className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
                placeholder="https://example.com/video.mp4"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.content?.autoplay ?? true}
                  onChange={(e) =>
                    handleUpdateContent(item.id, {
                      content: { ...item.content, autoplay: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-[#00A0FF] bg-[#060606] border-[#1A1A1A] rounded focus:ring-[#00A0FF]"
                />
                <span className="text-sm text-[#CCCCCC]">Autoplay</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.content?.loop ?? true}
                  onChange={(e) =>
                    handleUpdateContent(item.id, {
                      content: { ...item.content, loop: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-[#00A0FF] bg-[#060606] border-[#1A1A1A] rounded focus:ring-[#00A0FF]"
                />
                <span className="text-sm text-[#CCCCCC]">Loop</span>
              </label>
            </div>
            {item.content?.url && (
              <MediaPreview url={item.content.url} type="video" />
            )}
          </div>
        );
      case "cardManifest":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                Card Image URL
              </label>
              <input
                type="url"
                value={item.content?.cardImageUrl || ""}
                onChange={(e) =>
                  handleUpdateContent(item.id, {
                    content: { ...item.content, cardImageUrl: e.target.value },
                  })
                }
                className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
                placeholder="https://example.com/card-image.jpg"
              />
              <p className="mt-2 text-xs text-[#8A8A8A]">
                URL to the card preview image (recommended: 800x1200px portrait)
              </p>
            </div>
            {item.content?.cardImageUrl && (
              <MediaPreview url={item.content.cardImageUrl} type="image" />
            )}
          </div>
        );
      case "signup":
        return (
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.content?.enabled ?? true}
                  onChange={(e) =>
                    handleUpdateContent(item.id, {
                      content: { ...item.content, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-[#00A0FF] bg-[#060606] border-[#1A1A1A] rounded focus:ring-[#00A0FF]"
                />
                <span className="text-sm font-medium text-[#CCCCCC]">
                  Enable signup form
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                Placeholder Text
              </label>
              <input
                type="text"
                value={item.content?.placeholder || ""}
                onChange={(e) =>
                  handleUpdateContent(item.id, {
                    content: { ...item.content, placeholder: e.target.value },
                  })
                }
                className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
                placeholder="メールアドレスを入力"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                Button Text
              </label>
              <input
                type="text"
                value={item.content?.buttonText || ""}
                onChange={(e) =>
                  handleUpdateContent(item.id, {
                    content: { ...item.content, buttonText: e.target.value },
                  })
                }
                className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
                placeholder="登録"
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="text-[#8A8A8A] text-sm">
            Editor for {item.contentType} coming soon
          </div>
        );
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
      {/* Add Section Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Content Sections</h2>
        <button
          onClick={() => setShowAddSection(!showAddSection)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {/* Add Section Form */}
      {showAddSection && (
        <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                Section Type
              </label>
              <select
                value={newSection.section}
                onChange={(e) => {
                  const newSectionValue = e.target.value;
                  const availableTypes = getContentTypesForSection(newSectionValue);
                  setNewSection({
                    section: newSectionValue,
                    contentType: availableTypes[0] || "text",
                  });
                }}
                className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white focus:outline-none focus:border-[#00A0FF] transition-colors"
              >
                <option value="hero">Hero</option>
                <option value="description">Description</option>
                <option value="cards">Cards</option>
                <option value="signup">Signup</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
                Content Type
              </label>
              <select
                value={newSection.contentType}
                onChange={(e) =>
                  setNewSection({ ...newSection, contentType: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white focus:outline-none focus:border-[#00A0FF] transition-colors"
              >
                {getContentTypesForSection(newSection.section).map((type) => (
                  <option key={type} value={type}>
                    {type === "hero" ? "Hero" : type === "richText" ? "Rich Text" : type === "cardManifest" ? "Card Manifest" : type === "signup" ? "Signup Form" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddSection}
              className="px-4 py-2 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
            >
              Add Section
            </button>
            <button
              onClick={() => {
                setShowAddSection(false);
                const defaultTypes = getContentTypesForSection("hero");
                setNewSection({ section: "hero", contentType: defaultTypes[0] || "hero" });
              }}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#CCCCCC] font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content Sections */}
      {content.length === 0 ? (
        <div className="text-center py-12 bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl">
          <p className="text-[#8A8A8A] mb-4">No content sections yet</p>
          <p className="text-sm text-[#6A6A6A]">
            Click "Add Section" to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {content.map((item) => (
            <div
              key={item.id}
              className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-[#6A6A6A]" />
                  <div>
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {item.section}
                    </h3>
                    <p className="text-sm text-[#8A8A8A]">{item.contentType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleVisibility(item.id, item.isVisible)}
                    className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
                    title={item.isVisible ? "Hide" : "Show"}
                  >
                    {item.isVisible ? (
                      <Eye className="w-4 h-4 text-[#8A8A8A]" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-[#6A6A6A]" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteSection(item.id)}
                    className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4">{renderContentEditor(item)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
