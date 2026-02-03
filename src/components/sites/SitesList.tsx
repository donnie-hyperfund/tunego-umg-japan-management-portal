"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, Trash2, Eye, EyeOff, Loader2, Plus } from "lucide-react";

interface CampaignSite {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  status: "draft" | "published" | "archived";
  vercelProjectId: string | null;
  vercelDeploymentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SitesList() {
  const [sites, setSites] = useState<CampaignSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
  }, [filter]);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const url = filter === "all" 
        ? "/api/sites" 
        : `/api/sites?status=${filter}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch sites");
      const data = await response.json();
      setSites(data);
    } catch (error) {
      console.error("Error fetching sites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this site? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/sites/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete site");
      
      setSites(sites.filter((site) => site.id !== id));
    } catch (error) {
      console.error("Error deleting site:", error);
      alert("Failed to delete site. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-[#1A1A1A] text-[#8A8A8A] border-[#2A2A2A]",
      published: "bg-[#00A0FF]/20 text-[#00A0FF] border-[#00A0FF]/30",
      archived: "bg-[#8A8A8A]/20 text-[#8A8A8A] border-[#8A8A8A]/30",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${
          styles[status as keyof typeof styles] || styles.draft
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#00A0FF] animate-spin" />
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8A8A8A] text-lg mb-4">No sites found</p>
        <Link
          href="/sites/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Your First Site
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[#1A1A1A]">
        {(["all", "draft", "published", "archived"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              filter === status
                ? "border-[#00A0FF] text-[#00A0FF]"
                : "border-transparent text-[#8A8A8A] hover:text-[#CCCCCC]"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {sites.map((site) => (
          <div
            key={site.id}
            className="group relative overflow-hidden bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl hover:border-[#00A0FF] transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,160,255,0.2)]"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {site.displayName}
                  </h3>
                  <p className="text-[#8A8A8A] text-sm mb-3">/{site.slug}</p>
                  {getStatusBadge(site.status)}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-4">
                <span>
                  Updated {new Date(site.updatedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-[#1A1A1A]">
                <Link
                  href={`/sites/${site.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#CCCCCC] rounded-lg transition-colors text-sm font-medium"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Link>
                {site.vercelDeploymentUrl && (
                  <a
                    href={site.vercelDeploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#CCCCCC] rounded-lg transition-colors"
                    title="View live site"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(site.id)}
                  disabled={deletingId === site.id}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-red-400 hover:text-red-300 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete site"
                >
                  {deletingId === site.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
