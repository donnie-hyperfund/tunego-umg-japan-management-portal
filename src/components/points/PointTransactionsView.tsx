"use client";

import { useState, useEffect } from "react";

interface PointTransaction {
  id: string;
  userId: string;
  points: number;
  transactionType: string;
  source: string;
  description: string | null;
  metadata: any;
  createdAt: string;
}

export default function PointTransactionsView() {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: "",
    source: "",
    type: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.source) params.append("source", filters.source);
      if (filters.type) params.append("type", filters.type);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/point-transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    setLoading(true);
    fetchTransactions();
  };

  const clearFilters = () => {
    setFilters({
      userId: "",
      source: "",
      type: "",
      startDate: "",
      endDate: "",
    });
    setLoading(true);
    setTimeout(() => {
      fetchTransactions();
    }, 100);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A0FF]"></div>
        <p className="mt-4 text-[#AAAAAA]">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl shadow-lg">
      <div className="p-6 border-b border-[#1A1A1A]">
        <h3 className="text-xl font-bold text-white">Point Transactions</h3>
      </div>

      <div className="p-6 border-b border-[#1A1A1A] bg-[#060606]">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">User ID</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white placeholder-[#6A6A6A] focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
              placeholder="Filter by user ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">Source</label>
            <input
              type="text"
              value={filters.source}
              onChange={(e) => handleFilterChange("source", e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white placeholder-[#6A6A6A] focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
              placeholder="Filter by source"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
            >
              <option value="">All Types</option>
              <option value="earned">Earned</option>
              <option value="spent">Spent</option>
              <option value="adjusted">Adjusted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[#CCCCCC]">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg text-white focus:border-[#00A0FF] focus:outline-none focus:ring-1 focus:ring-[#00A0FF] transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={applyFilters}
            className="px-6 py-3 bg-[#00A0FF] text-white rounded-lg hover:bg-[#0088DD] transition-colors font-medium shadow-[0_0_10px_rgba(0,160,255,0.3)] min-w-[120px]"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-6 py-3 bg-[#1A1A1A] text-[#CCCCCC] rounded-lg hover:bg-[#2A2A2A] transition-colors font-medium border border-[#2A2A2A] min-w-[80px]"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A1A1A] bg-[#060606]">
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">User ID</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Points</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Type</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Source</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Description</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center px-6 py-12 text-[#6A6A6A]">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-[#1A1A1A] hover:bg-[#0A0A0A] transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-[#AAAAAA]">{transaction.userId}</td>
                  <td
                    className={`px-6 py-4 font-semibold ${
                      transaction.transactionType === "earned"
                        ? "text-green-400"
                        : transaction.transactionType === "spent"
                        ? "text-red-400"
                        : "text-[#FF9900]"
                    }`}
                  >
                    {transaction.transactionType === "earned" ? "+" : "-"}
                    {transaction.points}
                  </td>
                  <td className="px-6 py-4 text-[#AAAAAA]">{transaction.transactionType}</td>
                  <td className="px-6 py-4 text-[#AAAAAA]">{transaction.source}</td>
                  <td className="px-6 py-4 text-[#AAAAAA]">{transaction.description || "-"}</td>
                  <td className="px-6 py-4 text-sm text-[#AAAAAA]">
                    {new Date(transaction.createdAt).toLocaleString()}
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
