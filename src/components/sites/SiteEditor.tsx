"use client";

import { useState, useEffect } from "react";
import { Settings, FileText, Image, CreditCard, Eye, Rocket } from "lucide-react";
import SiteForm from "./SiteForm";
import ContentEditor from "./ContentEditor";
import AssetsManager from "./AssetsManager";
import CardManifestsEditor from "./CardManifestsEditor";
import TemplatePreview from "./TemplatePreview";
import DeploymentPanel from "./DeploymentPanel";
import { useIsAdmin } from "@/lib/auth-client";

interface SiteEditorProps {
  siteId: string;
}

type Tab = "general" | "content" | "assets" | "cards" | "preview" | "deploy";

export default function SiteEditor({ siteId }: SiteEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const isAdmin = useIsAdmin();
  const [siteData, setSiteData] = useState<{
    vercelProjectId: string | null;
    vercelDeploymentUrl: string | null;
    deploymentStatus: string | null;
  } | null>(null);

  useEffect(() => {
    fetchSiteData();
  }, [siteId]);

  const fetchSiteData = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}`);
      if (response.ok) {
        const site = await response.json();
        setTemplateId(site.templateId || "collectible-campaign");
        setSiteData({
          vercelProjectId: site.vercelProjectId,
          vercelDeploymentUrl: site.vercelDeploymentUrl,
          deploymentStatus: site.deploymentStatus,
        });
      }
    } catch (error) {
      console.error("Error fetching site data:", error);
    }
  };

  const tabs = [
    { id: "general" as Tab, label: "General", icon: Settings },
    { id: "content" as Tab, label: "Content", icon: FileText },
    { id: "assets" as Tab, label: "Assets", icon: Image },
    { id: "cards" as Tab, label: "Cards", icon: CreditCard },
    { id: "preview" as Tab, label: "Preview", icon: Eye },
    // Only show deploy tab for admins
    ...(isAdmin ? [{ id: "deploy" as Tab, label: "Deploy", icon: Rocket }] : []),
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 border-b border-[#1A1A1A]">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#00A0FF] text-[#00A0FF]"
                    : "border-transparent text-[#8A8A8A] hover:text-[#CCCCCC]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "general" && <SiteForm siteId={siteId} />}
        {activeTab === "content" && <ContentEditor siteId={siteId} />}
        {activeTab === "assets" && <AssetsManager siteId={siteId} />}
        {activeTab === "cards" && <CardManifestsEditor siteId={siteId} />}
        {activeTab === "preview" && templateId && (
          <TemplatePreview siteId={siteId} templateId={templateId} />
        )}
        {activeTab === "deploy" && siteData && (
          <DeploymentPanel
            siteId={siteId}
            vercelProjectId={siteData.vercelProjectId}
            vercelDeploymentUrl={siteData.vercelDeploymentUrl}
            deploymentStatus={siteData.deploymentStatus}
          />
        )}
      </div>
    </div>
  );
}
