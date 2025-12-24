
'use client';

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { PageLayout } from "@/components/layout/page-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SOPCard } from "@/components/sop-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingBag, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MarketplaceSOP {
  id: string;
  title: string;
  description: string;
  type: 'MARKETPLACE';
  price: number;
  createdAt: Date;
  creator: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
  category?: {
    id: string;
    name: string;
  };
  steps: Array<{ id: string }>;
  _count: {
    executions: number;
    purchases: number;
  };
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [sops, setSOPs] = useState<MarketplaceSOP[]>([]);
  const [filteredSOPs, setFilteredSOPs] = useState<MarketplaceSOP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [purchasingSOPId, setPurchasingSOPId] = useState<string | null>(null);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const loadSOPs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (selectedCategory) params.set('categoryId', selectedCategory);
      params.set('sortBy', sortBy);

      const response = await fetch(`/api/marketplace?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load SOPs');

      const data = await response.json();
      const sopData = data.map((sop: any) => ({
        ...sop,
        createdAt: new Date(sop.createdAt)
      }));
      setSOPs(sopData);
      setFilteredSOPs(sopData);
    } catch (error) {
      console.error('Error loading SOPs:', error);
      toast.error('Failed to load marketplace SOPs');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, minPrice, maxPrice, selectedCategory, sortBy]);

  useEffect(() => {
    loadSOPs();
  }, [loadSOPs]);

  const handlePurchase = async (sopId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setPurchasingSOPId(sopId);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sopId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout');
      }

      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe Checkout
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate purchase');
    } finally {
      setPurchasingSOPId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadSOPs();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedCategory("");
    setSortBy("newest");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);
  };

  return (
    <PageLayout>
      <div className="bg-gray-50 min-h-screen">
        <PageHeader 
        title="MedNAIS SOPs"
        description="Discover and purchase expert-created Standard Operating Procedures"
      >
        <Button onClick={loadSOPs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SOPs..."
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <SelectItem value="all">📂 All Categories</SelectItem>
                      {categories.map((category: any) => (
                        <>
                          <SelectItem key={category.id} value={category.id} className="font-semibold">
                            📁 {category.name}
                          </SelectItem>
                          {category.subcategories && category.subcategories.map((sub: any) => (
                            <SelectItem key={sub.id} value={sub.id} className="pl-8 text-sm">
                              └─ {sub.name.replace(`${category.name} - `, '')}
                            </SelectItem>
                          ))}
                        </>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Min Price ($)</label>
                  <Input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Max Price ($)</label>
                  <Input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="100"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredSOPs.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredSOPs.length} SOP{filteredSOPs.length !== 1 ? 's' : ''} found
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSOPs.map((sop) => (
                <SOPCard
                  key={sop.id}
                  sop={sop}
                  showCreator={true}
                  showExecuteButton={false}
                  showPrice={true}
                  onPurchase={() => handlePurchase(sop.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<ShoppingBag className="h-16 w-16" />}
            title="No SOPs found"
            description={
              searchQuery || minPrice || maxPrice
                ? "Try adjusting your search criteria or filters"
                : "No SOPs are currently available in the marketplace"
            }
            action={
              (searchQuery || minPrice || maxPrice) ? (
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
      </div>
    </PageLayout>
  );
}
