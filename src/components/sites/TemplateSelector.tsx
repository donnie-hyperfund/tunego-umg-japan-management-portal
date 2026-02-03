"use client";

import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description?: string;
  templatePath?: string;
  sections?: Array<{
    id: string;
    name: string;
    required: boolean;
  }>;
  features?: {
    videoBackground?: boolean;
    imageBackground?: boolean;
    cardShowcase?: boolean;
    emailSignup?: boolean;
  };
}

interface TemplateSelectorProps {
  value?: string;
  onChange: (templateId: string | null) => void;
  disabled?: boolean;
}

export default function TemplateSelector({ value, onChange, disabled }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[#00A0FF] animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[#CCCCCC] mb-3">
        Template
      </label>
      {templates.length === 0 ? (
        <div className="text-center py-8 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg">
          <p className="text-[#8A8A8A] text-sm">No templates available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => !disabled && onChange(template.id)}
              disabled={disabled}
              className={`relative p-4 text-left border-2 rounded-lg transition-all ${
                value === template.id
                  ? "border-[#00A0FF] bg-[#00A0FF]/10"
                  : "border-[#1A1A1A] bg-[#0F0F0F] hover:border-[#2A2A2A]"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {value === template.id && (
                <div className="absolute top-2 right-2">
                  <Check className="w-5 h-5 text-[#00A0FF]" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-white mb-1">
                {template.name}
              </h3>
              {template.description && (
                <p className="text-sm text-[#8A8A8A] mb-3">
                  {template.description}
                </p>
              )}
              {template.features && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {template.features.videoBackground && (
                    <span className="px-2 py-1 text-xs bg-[#1A1A1A] text-[#8A8A8A] rounded">
                      Video BG
                    </span>
                  )}
                  {template.features.cardShowcase && (
                    <span className="px-2 py-1 text-xs bg-[#1A1A1A] text-[#8A8A8A] rounded">
                      3D Cards
                    </span>
                  )}
                  {template.features.emailSignup && (
                    <span className="px-2 py-1 text-xs bg-[#1A1A1A] text-[#8A8A8A] rounded">
                      Signup
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-[#8A8A8A]">
        Select a template to define the structure and layout of your campaign site
      </p>
    </div>
  );
}
