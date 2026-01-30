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
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Point Transactions</h3>

      <div className="mb-4 p-4 border rounded">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-2">
          <div>
            <label className="block text-sm font-medium mb-1">User ID</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Filter by user ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <input
              type="text"
              value={filters.source}
              onChange={(e) => handleFilterChange("source", e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Filter by source"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">All Types</option>
              <option value="earned">Earned</option>
              <option value="spent">Spent</option>
              <option value="adjusted">Adjusted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">User ID</th>
              <th className="text-left p-2">Points</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Source</th>
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b">
                  <td className="p-2 font-mono text-sm">{transaction.userId}</td>
                  <td
                    className={`p-2 font-semibold ${
                      transaction.transactionType === "earned"
                        ? "text-green-600"
                        : transaction.transactionType === "spent"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {transaction.transactionType === "earned" ? "+" : "-"}
                    {transaction.points}
                  </td>
                  <td className="p-2">{transaction.transactionType}</td>
                  <td className="p-2">{transaction.source}</td>
                  <td className="p-2">{transaction.description || "-"}</td>
                  <td className="p-2 text-sm">
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
