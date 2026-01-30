"use client";

import { useState, useEffect } from "react";
import { Power, PowerOff, Pencil, Trash2 } from "lucide-react";

interface PointRule {
  id: string;
  name: string;
  description: string | null;
  points: number;
  source: string;
  isActive: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export default function PointRulesManager() {
  const [rules, setRules] = useState<PointRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PointRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    points: 0,
    source: "",
    isActive: true,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch("/api/point-rules");
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRule
        ? `/api/point-rules/${editingRule.id}`
        : "/api/point-rules";
      const method = editingRule ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchRules();
        setShowForm(false);
        setEditingRule(null);
        setFormData({
          name: "",
          description: "",
          points: 0,
          source: "",
          isActive: true,
        });
      }
    } catch (error) {
      console.error("Error saving rule:", error);
    }
  };

  const handleEdit = (rule: PointRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      points: rule.points,
      source: rule.source,
      isActive: rule.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      const response = await fetch(`/api/point-rules/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  const toggleActive = async (rule: PointRule) => {
    try {
      const response = await fetch(`/api/point-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error("Error updating rule:", error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A0FF]"></div>
        <p className="mt-4 text-[#AAAAAA]">Loading rules...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl shadow-lg">
      <div className="flex justify-between items-center p-6 border-b border-[#1A1A1A]">
        <h3 className="text-xl font-bold text-white">Point Rules</h3>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingRule(null);
            setFormData({
              name: "",
              description: "",
              points: 0,
              source: "",
              isActive: true,
            });
          }}
          className="px-5 py-2.5 bg-[#00A0FF] text-white rounded-lg hover:bg-[#0088DD] transition-colors text-sm font-medium shadow-[0_0_10px_rgba(0,160,255,0.3)]"
        >
          + Add New Rule
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border-b border-[#1A1A1A] bg-[#060606]">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white placeholder-[#6A6A6A] focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">Source</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white placeholder-[#6A6A6A] focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">Points</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) =>
                  setFormData({ ...formData, points: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">Active</label>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-[#1A1A1A] bg-[#0F0F0F] text-[#00A0FF] focus:ring-[#00A0FF] focus:ring-2"
                />
                <span className="ml-2 text-[#AAAAAA] text-sm">
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white placeholder-[#6A6A6A] focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors resize-none"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00A0FF] text-white rounded-lg hover:bg-[#0088DD] transition-colors text-sm font-medium shadow-[0_0_10px_rgba(0,160,255,0.3)]"
            >
              {editingRule ? "Update Rule" : "Create Rule"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingRule(null);
              }}
              className="px-5 py-2.5 bg-[#1A1A1A] text-[#CCCCCC] rounded-lg hover:bg-[#2A2A2A] transition-colors text-sm font-medium border border-[#2A2A2A]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A1A1A] bg-[#060606]">
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Source</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Points</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center px-6 py-12 text-[#6A6A6A]">
                  No rules found. Create one to get started.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-b border-[#1A1A1A] hover:bg-[#0A0A0A] transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{rule.name}</td>
                  <td className="px-6 py-4 text-[#AAAAAA]">{rule.source}</td>
                  <td className="px-6 py-4 text-[#00A0FF] font-semibold">{rule.points}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        rule.isActive
                          ? "bg-[#00A0FF]/20 text-[#00A0FF] border border-[#00A0FF]/30"
                          : "bg-[#3A3A3A] text-[#8A8A8A] border border-[#2A2A2A]"
                      }`}
                    >
                      {rule.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => toggleActive(rule)}
                        className="p-2 text-[#00A0FF] hover:text-[#0088DD] hover:bg-[#00A0FF]/10 rounded transition-colors"
                        title={rule.isActive ? "Deactivate" : "Activate"}
                      >
                        {rule.isActive ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-2 text-[#FF9900] hover:text-[#FF8800] hover:bg-[#FF9900]/10 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
