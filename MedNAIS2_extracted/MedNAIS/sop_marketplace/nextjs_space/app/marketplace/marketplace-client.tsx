
"use client";

import { useState, useEffect } from "react";
import { SOPCard } from "@/components/sop-card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Search, Filter, FileText, Grid, List } from "lucide-react";

export function MarketplaceClient() {
  const [sops, setSops] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSOPs();
  }, [search, selectedCategory, sort, page]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSOPs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        sort,
      });

      if (search) params.append("search", search);
      if (selectedCategory) params.append("categoryId", selectedCategory);

      const response = await fetch(`/api/sops?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSops(data.sops || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching SOPs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search SOPs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700 appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700 appearance-none"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${
              viewMode === "grid"
                ? "bg-[#E63946] text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${
              viewMode === "list"
                ? "bg-[#E63946] text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : sops.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No SOPs Found"
          description="Try adjusting your search or filters to find what you're looking for."
          action={{
            label: "Clear Filters",
            href: "/marketplace",
          }}
        />
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
                : "space-y-3 max-w-4xl mx-auto"
            }
          >
            {sops.map((sop) => (
              <div
                key={sop.id}
                className={viewMode === "list" ? "scale-90 origin-top" : ""}
              >
                <SOPCard sop={sop} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
