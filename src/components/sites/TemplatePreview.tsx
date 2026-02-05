"use client";

import { useEffect, useState } from "react";
import { renderTemplate } from "@/lib/template-renderer";
import { Loader2 } from "lucide-react";

interface SiteContent {
  id: string;
  section: string;
  contentType: string;
  content: any;
  order: number;
  isVisible: boolean;
}

interface TemplatePreviewProps {
  siteId: string;
  templateId: string;
}

export default function TemplatePreview({ siteId, templateId }: TemplatePreviewProps) {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');

  useEffect(() => {
    fetchContent();
    fetchTemplateName();
    fetchSiteData();
  }, [siteId, templateId]);

  const fetchSiteData = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}`);
      if (response.ok) {
        const site = await response.json();
        setBackgroundColor(site.backgroundColor || '#000000');
        setTextColor(site.textColor || '#FFFFFF');
      }
    } catch (error) {
      console.error("Error fetching site data:", error);
    }
  };

  const fetchTemplateName = async () => {
    try {
      // Normalize template name: convert to lowercase and replace spaces with hyphens
      const normalizeTemplateName = (name: string): string => {
        return name.toLowerCase().replace(/\s+/g, '-');
      };

      // If templateId looks like a UUID, fetch the template to get its name
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(templateId)) {
        const response = await fetch(`/api/templates/${templateId}`);
        if (response.ok) {
          const template = await response.json();
          // Normalize the template name to match directory structure
          const name = template.name || template.id;
          setTemplateName(normalizeTemplateName(name));
        } else {
          // Fallback: try to get from site data
          const siteResponse = await fetch(`/api/sites/${siteId}`);
          if (siteResponse.ok) {
            const site = await siteResponse.json();
            // Try to get template name from site's template relationship
            if (site.template) {
              setTemplateName(normalizeTemplateName(site.template.name));
            } else if (site.templateId) {
              // If we have templateId but no template object, try fetching template
              const templateResponse = await fetch(`/api/templates/${site.templateId}`);
              if (templateResponse.ok) {
                const template = await templateResponse.json();
                setTemplateName(normalizeTemplateName(template.name || template.id));
              }
            }
          }
        }
      } else {
        // It's already a template name, but normalize it
        setTemplateName(normalizeTemplateName(templateId));
      }
    } catch (error) {
      console.error("Error fetching template name:", error);
      // Fallback: normalize the templateId
      const normalized = templateId.toLowerCase().replace(/\s+/g, '-');
      setTemplateName(normalized);
    }
  };

  const fetchContent = async () => {
    try {
      setLoading(true);
      const [contentResponse, cardsResponse] = await Promise.all([
        fetch(`/api/sites/${siteId}/content`),
        fetch(`/api/sites/${siteId}/card-manifests`),
      ]);
      
      if (!contentResponse.ok) throw new Error("Failed to fetch content");
      const contentData = await contentResponse.json();
      
      // Fetch active card manifests and add them to content
      let cardContent: SiteContent[] = [];
      if (cardsResponse.ok) {
        const cardsData = await cardsResponse.json();
        const activeCards = cardsData.filter((card: any) => card.isActive);
        if (activeCards.length > 0) {
          const activeCard = activeCards[0];
          // Derive media types from URLs
          const frontMediaType = activeCard.frontImageUrl?.match(/\.(mp4|webm|mov)$/i) ? "video" : "image";
          const backMediaType = activeCard.backImageUrl?.match(/\.(mp4|webm|mov)$/i) ? "video" : "image";
          
          cardContent = [{
            id: activeCard.id,
            section: "cards",
            contentType: "cardManifest",
            content: {
              cardImageUrl: activeCard.cardImageUrl || activeCard.frontImageUrl,
              frontImageUrl: activeCard.frontImageUrl,
              backImageUrl: activeCard.backImageUrl,
              frontMediaType: frontMediaType,
              backMediaType: backMediaType,
              flipEnabled: activeCard.manifest?.interactions?.flipEnabled !== false,
            },
            order: 0,
            isVisible: true,
          }];
        }
      }
      
      // Combine content and card content
      const allContent = [...contentData.filter((item: SiteContent) => item.isVisible), ...cardContent];
      setContent(allContent);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !templateName) {
    return (
      <div className="flex items-center justify-center py-12 bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl">
        <Loader2 className="w-8 h-8 text-[#00A0FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#1A1A1A]">
        <h3 className="text-lg font-semibold text-white">Preview</h3>
        <p className="text-sm text-[#8A8A8A]">
          How your site will look • Template: {templateName}
        </p>
      </div>
      <div 
        className="relative bg-black" 
        style={{ 
          minHeight: "600px", 
          maxHeight: "800px", 
          overflow: "hidden"
        }}
      >
        <div className="relative w-full h-full" style={{ height: "800px", overflow: "auto" }}>
          {renderTemplate(templateName, content, [], true, backgroundColor, textColor)}
        </div>
      </div>
    </div>
  );
}
