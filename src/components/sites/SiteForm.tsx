"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import TemplateSelector from "./TemplateSelector";

interface CampaignSite {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  status: "draft" | "published" | "archived";
  templateId: string | null;
  vercelProjectId: string | null;
  vercelDeploymentUrl: string | null;
  enableUserManagement: boolean;
  clerkPublishableKey: string | null;
  clerkSecretKey: string | null;
}

interface SiteFormState {
  name: string;
  displayName: string;
  slug: string;
  status: "draft" | "published" | "archived";
  templateId: string;
  enableUserManagement: boolean;
  clerkPublishableKey: string;
  clerkSecretKey: string;
  originalName?: string; // Track original name to detect changes
}

interface SiteFormProps {
  siteId?: string;
}

export default function SiteForm({ siteId }: SiteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!siteId);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SiteFormState>({
    name: "",
    displayName: "",
    slug: "",
    status: "draft" as "draft" | "published" | "archived",
    templateId: "",
    enableUserManagement: true,
    clerkPublishableKey: "",
    clerkSecretKey: "",
    originalName: "",
  });
  const [hasVercelProject, setHasVercelProject] = useState(false);

  useEffect(() => {
    if (siteId) {
      fetchSite();
    }
  }, [siteId]);

  const fetchSite = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sites/${siteId}`);
      if (!response.ok) throw new Error("Failed to fetch site");
      const site: CampaignSite = await response.json();
      setFormData({
        name: site.name,
        displayName: site.displayName,
        slug: site.slug,
        status: site.status,
        templateId: site.templateId || "",
        enableUserManagement: site.enableUserManagement ?? true,
        clerkPublishableKey: site.clerkPublishableKey || "",
        clerkSecretKey: site.clerkSecretKey || "",
        originalName: site.name,
      });
      setHasVercelProject(!!site.vercelProjectId);
    } catch (error) {
      console.error("Error fetching site:", error);
      alert("Failed to load site. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = siteId ? `/api/sites/${siteId}` : "/api/sites";
      const method = siteId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          templateId: formData.templateId || null,
          clerkPublishableKey: formData.clerkPublishableKey || null,
          clerkSecretKey: formData.clerkSecretKey || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save site");
      }

      const savedSite = await response.json();
      router.push(`/sites/${savedSite.id}`);
      router.refresh();
    } catch (error: any) {
      console.error("Error saving site:", error);
      alert(error.message || "Failed to save site. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleDisplayNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      displayName: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#00A0FF] animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl p-6 md:p-8">
        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-[#CCCCCC] mb-2"
            >
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
              placeholder="King & Prince と打ち上げ花火 2025"
            />
            <p className="mt-1 text-xs text-[#8A8A8A]">
              The public-facing name for this campaign site
            </p>
          </div>

          {/* Name (Internal) */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[#CCCCCC] mb-2"
            >
              Internal Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
              placeholder="king-and-prince-2025"
            />
            <p className="mt-1 text-xs text-[#8A8A8A]">
              Internal identifier (alphanumeric, hyphens, underscores only)
            </p>
            {hasVercelProject && formData.name !== formData.originalName && (
              <div className="mt-2 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-400">
                  <strong>Note:</strong> Changing the internal name will update the Vercel project name on the next deployment. The existing Vercel project will be renamed, not replaced.
                </p>
              </div>
            )}
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-[#CCCCCC] mb-2"
            >
              URL Slug *
            </label>
            <input
              type="text"
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  slug: generateSlug(e.target.value),
                }))
              }
              required
              className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors"
              placeholder="king-and-prince-2025"
            />
            <p className="mt-1 text-xs text-[#8A8A8A]">
              URL-friendly identifier (auto-generated from display name)
            </p>
          </div>

          {/* Template Selection - only show when creating new site */}
          {!siteId && (
            <div>
              <TemplateSelector
                value={formData.templateId || undefined}
                onChange={(templateId) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateId: templateId || "",
                  }))
                }
              />
            </div>
          )}

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-[#CCCCCC] mb-2"
            >
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as "draft" | "published" | "archived",
                }))
              }
              className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white focus:outline-none focus:border-[#00A0FF] transition-colors"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Management Configuration */}
      <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl p-6 md:p-8">
        <h3 className="text-lg font-semibold text-white mb-4">User Management</h3>
        <div className="space-y-6">
          {/* Enable User Management Toggle */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="enableUserManagement"
              checked={formData.enableUserManagement}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  enableUserManagement: e.target.checked,
                }))
              }
              className="mt-1 w-4 h-4 text-[#00A0FF] bg-[#060606] border-[#1A1A1A] rounded focus:ring-[#00A0FF] focus:ring-2"
            />
            <div className="flex-1">
              <label
                htmlFor="enableUserManagement"
                className="block text-sm font-medium text-[#CCCCCC] mb-1"
              >
                Enable User Management
              </label>
              <p className="text-xs text-[#8A8A8A]">
                Enable Clerk authentication for user sign-in and account management. 
                Disable for marketing-only campaigns that don't require user accounts.
              </p>
            </div>
          </div>

          {/* Clerk Configuration - only show if user management is enabled */}
          {formData.enableUserManagement && (
            <div className="space-y-4 pl-7 border-l-2 border-[#1A1A1A]">
              <div className="bg-[#1A1A1A] rounded-lg p-4 mb-4">
                <p className="text-xs text-[#8A8A8A] mb-2">
                  <strong className="text-[#CCCCCC]">Note:</strong> If left empty, the site will use the global Clerk keys from the management portal's environment variables.
                </p>
                <p className="text-xs text-[#8A8A8A]">
                  Get your Clerk keys from{" "}
                  <a
                    href="https://dashboard.clerk.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00A0FF] hover:underline"
                  >
                    https://dashboard.clerk.com
                  </a>
                </p>
              </div>

              {/* Clerk Publishable Key */}
              <div>
                <label
                  htmlFor="clerkPublishableKey"
                  className="block text-sm font-medium text-[#CCCCCC] mb-2"
                >
                  Clerk Publishable Key (Optional)
                </label>
                <input
                  type="text"
                  id="clerkPublishableKey"
                  value={formData.clerkPublishableKey}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      clerkPublishableKey: e.target.value,
                    }))
                  }
                  placeholder="pk_test_... (leave empty to use global default)"
                  className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors font-mono text-sm"
                />
                <p className="mt-1 text-xs text-[#8A8A8A]">
                  Site-specific publishable key. Starts with "pk_test_" or "pk_live_"
                </p>
              </div>

              {/* Clerk Secret Key */}
              <div>
                <label
                  htmlFor="clerkSecretKey"
                  className="block text-sm font-medium text-[#CCCCCC] mb-2"
                >
                  Clerk Secret Key (Optional)
                </label>
                <input
                  type="password"
                  id="clerkSecretKey"
                  value={formData.clerkSecretKey}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      clerkSecretKey: e.target.value,
                    }))
                  }
                  placeholder="sk_test_... (leave empty to use global default)"
                  className="w-full px-4 py-2 bg-[#060606] border border-[#1A1A1A] rounded-lg text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#00A0FF] transition-colors font-mono text-sm"
                />
                <p className="mt-1 text-xs text-[#8A8A8A]">
                  Site-specific secret key. Starts with "sk_test_" or "sk_live_". Keep this secure!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Site"
          )}
        </button>
        <Link
          href="/sites"
          className="px-6 py-3 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#CCCCCC] font-medium rounded-lg transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
