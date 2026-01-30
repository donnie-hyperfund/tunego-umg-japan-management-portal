"use client";

import { useState, useEffect } from "react";

interface PointTransaction {
  id: string;
  userId: string;
  points: number;
  transactionType: string;
  source: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
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

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="p-4 sm:p-6 border-b border-[#1A1A1A]">
        <h3 className="text-lg sm:text-xl font-bold text-white">Point Transactions</h3>
      </div>

      <div className="p-4 sm:p-6 border-b border-[#1A1A1A] bg-[#060606]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 mb-6">
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
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={applyFilters}
            className="px-6 py-3 bg-[#00A0FF] text-white rounded-lg hover:bg-[#0088DD] transition-colors font-medium shadow-[0_0_10px_rgba(0,160,255,0.3)] w-full sm:w-auto sm:min-w-[120px]"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-6 py-3 bg-[#1A1A1A] text-[#CCCCCC] rounded-lg hover:bg-[#2A2A2A] transition-colors font-medium border border-[#2A2A2A] w-full sm:w-auto sm:min-w-[80px]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 p-4">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-[#6A6A6A]">
            No transactions found.
          </div>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-[#060606] border border-[#1A1A1A] rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs sm:text-sm text-[#AAAAAA] truncate">{transaction.userId}</p>
                  <p className="text-[#8A8A8A] text-xs mt-1">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-lg font-semibold text-sm shrink-0 ml-2 ${
                    transaction.transactionType === "earned"
                      ? "text-green-400 bg-green-400/10"
                      : transaction.transactionType === "spent"
                      ? "text-red-400 bg-red-400/10"
                      : "text-[#FF9900] bg-[#FF9900]/10"
                  }`}
                >
                  {transaction.transactionType === "earned" ? "+" : "-"}
                  {transaction.points}
                </div>
              </div>

              <div className="space-y-2 text-sm pt-2 border-t border-[#1A1A1A]">
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">Type:</span>
                  <span className="text-[#AAAAAA] capitalize">{transaction.transactionType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A8A8A]">Source:</span>
                  <span className="text-[#AAAAAA]">{transaction.source}</span>
                </div>
                {transaction.description && (
                  <div>
                    <span className="text-[#8A8A8A] block mb-1">Description:</span>
                    <span className="text-[#AAAAAA]">{transaction.description}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
