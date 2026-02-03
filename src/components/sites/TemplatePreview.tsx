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

  useEffect(() => {
    fetchContent();
    fetchTemplateName();
  }, [siteId, templateId]);

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
      const response = await fetch(`/api/sites/${siteId}/content`);
      if (!response.ok) throw new Error("Failed to fetch content");
      const data = await response.json();
      setContent(data.filter((item: SiteContent) => item.isVisible));
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
      <div className="relative bg-black" style={{ minHeight: "600px", maxHeight: "800px", overflow: "auto" }}>
        {renderTemplate(templateName, content)}
      </div>
    </div>
  );
}
