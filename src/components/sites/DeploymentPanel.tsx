"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Rocket, ExternalLink, Loader2, CheckCircle, XCircle, RefreshCw, Shield } from "lucide-react";
import { useIsAdmin } from "@/lib/auth-client";

interface DeploymentPanelProps {
  siteId: string;
  vercelProjectId: string | null;
  vercelDeploymentUrl: string | null;
  deploymentStatus?: string | null; // 'building', 'ready', 'error', 'canceled'
}

type DeploymentStatus = "idle" | "deploying" | "success" | "error" | "building" | "ready";

export default function DeploymentPanel({
  siteId,
  vercelProjectId,
  vercelDeploymentUrl,
  deploymentStatus,
}: DeploymentPanelProps) {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const [status, setStatus] = useState<DeploymentStatus>(
    deploymentStatus === 'building' ? 'building' : 
    deploymentStatus === 'ready' ? 'ready' : 
    deploymentStatus === 'error' ? 'error' : 
    'idle'
  );
  const [currentDeploymentStatus, setCurrentDeploymentStatus] = useState<string | null>(deploymentStatus ?? null);
  const [message, setMessage] = useState<string>("");
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(vercelDeploymentUrl);
  const [refreshing, setRefreshing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for status updates when deployment is building
  useEffect(() => {
    if (currentDeploymentStatus === 'building' && vercelProjectId) {
      // Start polling every 5 seconds
      const pollStatus = async () => {
        if (!vercelProjectId) return;
        try {
          const response = await fetch(`/api/sites/${siteId}/deployment-status`);
          if (response.ok) {
            const data = await response.json();
            setCurrentDeploymentStatus(data.status);
            setStatus(
              data.status === 'building' ? 'building' :
              data.status === 'ready' ? 'ready' :
              data.status === 'error' ? 'error' :
              'idle'
            );
            if (data.deploymentUrl) {
              setDeploymentUrl(data.deploymentUrl);
            }
            if (data.status !== currentDeploymentStatus) {
              router.refresh();
            }
          }
        } catch (error) {
          console.error('Error polling deployment status:', error);
        }
      };

      pollingIntervalRef.current = setInterval(pollStatus, 5000);
    } else {
      // Stop polling when not building
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [currentDeploymentStatus, vercelProjectId, siteId, router]);

  const refreshStatus = async () => {
    if (!vercelProjectId) return;

    try {
      setRefreshing(true);
      const response = await fetch(`/api/sites/${siteId}/deployment-status`);
      
      if (response.ok) {
        const data = await response.json();
        setCurrentDeploymentStatus(data.status);
        setStatus(
          data.status === 'building' ? 'building' :
          data.status === 'ready' ? 'ready' :
          data.status === 'error' ? 'error' :
          'idle'
        );
        
        if (data.deploymentUrl) {
          setDeploymentUrl(data.deploymentUrl);
        }

        // Refresh the page data if status changed
        if (data.status !== deploymentStatus) {
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Error refreshing deployment status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeploy = async () => {
    try {
      setStatus("deploying");
      setMessage("Generating project and deploying to Vercel...");

      const response = await fetch(`/api/sites/${siteId}/deploy`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Deployment failed");
      }

      const data = await response.json();
      
      // Update status based on deployment status
      if (data.status === 'building') {
        setStatus("building");
      } else if (data.deploymentUrl) {
        setStatus("ready");
      } else {
        setStatus("success");
      }
      
      setMessage(data.message || "Deployment initiated successfully!");
      
      if (data.deploymentUrl) {
        setDeploymentUrl(data.deploymentUrl);
      }

      // Start polling for status updates
      setCurrentDeploymentStatus(data.status || 'building');
      if (data.status === 'building') {
        // Polling will start automatically via useEffect
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Failed to deploy site");
      setCurrentDeploymentStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Deployment</h2>
        <p className="text-[#8A8A8A] text-sm">
          Deploy your site to Vercel with one click
        </p>
      </div>

      <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl p-6">
        {/* Status Display */}
        {vercelProjectId && (
          <div className="mb-4 p-3 bg-[#1A1A1A] rounded-lg">
            <p className="text-sm text-[#8A8A8A] mb-1">Vercel Project ID</p>
            <p className="text-[#CCCCCC] font-mono text-sm">{vercelProjectId}</p>
          </div>
        )}

        {deploymentUrl && (
          <div className="mb-4 p-3 bg-[#1A1A1A] rounded-lg">
            <p className="text-sm text-[#8A8A8A] mb-2">Live Site</p>
            <a
              href={deploymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#00A0FF] hover:text-[#0088CC] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {deploymentUrl}
            </a>
          </div>
        )}

        {/* Deployment Status */}
        {(currentDeploymentStatus || deploymentStatus) && (
          <div className="mb-4 p-3 bg-[#1A1A1A] rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-[#8A8A8A]">Deployment Status</p>
              <button
                onClick={refreshStatus}
                disabled={refreshing}
                className="text-xs text-[#00A0FF] hover:text-[#0088CC] disabled:opacity-50 flex items-center gap-1"
                title="Refresh status from Vercel"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="flex items-center gap-2">
              {(currentDeploymentStatus || deploymentStatus) === 'building' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span className="text-blue-400 font-medium capitalize">{currentDeploymentStatus || deploymentStatus}</span>
                  <span className="text-xs text-[#8A8A8A] ml-2">(Auto-refreshing...)</span>
                </>
              )}
              {(currentDeploymentStatus || deploymentStatus) === 'ready' && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium capitalize">{currentDeploymentStatus || deploymentStatus}</span>
                </>
              )}
              {((currentDeploymentStatus || deploymentStatus) === 'error' || (currentDeploymentStatus || deploymentStatus) === 'canceled') && (
                <>
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-medium capitalize">{currentDeploymentStatus || deploymentStatus}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              status === "success" || status === "ready"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : status === "error"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : status === "building" || status === "deploying"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-[#1A1A1A] text-[#8A8A8A]"
            }`}
          >
            {(status === "deploying" || status === "building") && <Loader2 className="w-4 h-4 animate-spin" />}
            {(status === "success" || status === "ready") && <CheckCircle className="w-4 h-4" />}
            {status === "error" && <XCircle className="w-4 h-4" />}
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Deploy Button */}
        {isAdmin ? (
          <div className="flex gap-3">
            <button
              onClick={handleDeploy}
              disabled={status === "deploying" || status === "building"}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#00A0FF] hover:bg-[#0088CC] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(status === "deploying" || status === "building") ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  {(currentDeploymentStatus || deploymentStatus) === 'ready' ? 'Redeploy to Vercel' : 'Deploy to Vercel'}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#1A1A1A] text-[#8A8A8A] font-medium rounded-lg border border-[#2A2A2A]">
              <Shield className="w-5 h-5" />
              Admin access required to deploy
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
          <p className="text-xs text-[#8A8A8A] mb-2">
            <strong className="text-[#CCCCCC]">Note:</strong> Deployment requires VERCEL_TOKEN to be configured in environment variables.
          </p>
          <p className="text-xs text-[#8A8A8A]">
            Each site deploys as a separate Vercel project. Developers can clone and iterate on the generated project while maintaining CMS functionality.
          </p>
        </div>
      </div>
    </div>
  );
}
