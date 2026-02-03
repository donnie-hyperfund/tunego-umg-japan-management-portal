"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import MediaPreview from "./MediaPreview";
import AssetPicker from "./AssetPicker";

interface HeroContent {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface HeroEditorProps {
  content: HeroContent;
  onChange: (content: HeroContent) => void;
  siteId: string;
}

export default function HeroEditor({ content, onChange, siteId }: HeroEditorProps) {
  const [localContent, setLocalContent] = useState<HeroContent>(
    content || {}
  );
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);

  const updateContent = (updates: Partial<HeroContent>) => {
    const newContent = { ...localContent, ...updates };
    setLocalContent(newContent);
    onChange(newContent);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
          Title
        </label>
        <input
          type="text"
          value={localContent.title || ""}
          onChange={(e) => updateContent({ title: e.target.value })}
          className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
          placeholder="Enter hero title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
          Subtitle
        </label>
        <textarea
          value={localContent.subtitle || ""}
          onChange={(e) => updateContent({ subtitle: e.target.value })}
          className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors min-h-[100px]"
          placeholder="Enter hero subtitle/description..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
            Background Image URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={localContent.backgroundImage || ""}
              onChange={(e) => updateContent({ backgroundImage: e.target.value })}
              className="flex-1 px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
              placeholder="https://example.com/image.jpg"
            />
            <button
              type="button"
              onClick={() => setShowImagePicker(true)}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#1A1A1A] rounded-lg text-[#CCCCCC] hover:text-white transition-colors flex items-center gap-2"
              title="Browse assets"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
          {localContent.backgroundImage && (
            <MediaPreview url={localContent.backgroundImage} type="image" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
            Background Video URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={localContent.backgroundVideo || ""}
              onChange={(e) => updateContent({ backgroundVideo: e.target.value })}
              className="flex-1 px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
              placeholder="https://example.com/video.mp4"
            />
            <button
              type="button"
              onClick={() => setShowVideoPicker(true)}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#1A1A1A] rounded-lg text-[#CCCCCC] hover:text-white transition-colors flex items-center gap-2"
              title="Browse assets"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
          {localContent.backgroundVideo && (
            <MediaPreview url={localContent.backgroundVideo} type="video" />
          )}
        </div>
      </div>

      {/* Asset Pickers */}
      {showImagePicker && (
        <AssetPicker
          siteId={siteId}
          isOpen={showImagePicker}
          onClose={() => setShowImagePicker(false)}
          onSelect={(url) => updateContent({ backgroundImage: url })}
          filterType="image"
          title="Select Background Image"
        />
      )}
      {showVideoPicker && (
        <AssetPicker
          siteId={siteId}
          isOpen={showVideoPicker}
          onClose={() => setShowVideoPicker(false)}
          onSelect={(url) => updateContent({ backgroundVideo: url })}
          filterType="video"
          title="Select Background Video"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
            CTA Button Text
          </label>
          <input
            type="text"
            value={localContent.ctaText || ""}
            onChange={(e) => updateContent({ ctaText: e.target.value })}
            className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
            placeholder="Get Started"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#CCCCCC] mb-2">
            CTA Button Link
          </label>
          <input
            type="url"
            value={localContent.ctaLink || ""}
            onChange={(e) => updateContent({ ctaLink: e.target.value })}
            className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
            placeholder="https://example.com"
          />
        </div>
      </div>
    </div>
  );
}
