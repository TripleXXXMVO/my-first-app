"use client";

import { useState, useEffect } from "react";
import type { AdminUserFilters, UserPlan } from "@/lib/admin";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface AdminUserFilterBarProps {
  filters: AdminUserFilters;
  onFilterChange: (partial: Partial<AdminUserFilters>) => void;
  total: number;
}

export function AdminUserFilterBar({
  filters,
  onFilterChange,
  total,
}: AdminUserFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const hasActiveFilters = filters.search !== "" || filters.plan !== "all";

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onFilterChange]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search by email */}
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#767676]" />
          <Input
            placeholder="Search by email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 font-body text-sm"
            aria-label="Search users by email"
          />
        </div>

        {/* Plan filter */}
        <Select
          value={filters.plan}
          onValueChange={(v) => onFilterChange({ plan: v as UserPlan | "all" })}
        >
          <SelectTrigger
            className="w-[120px] font-body text-sm"
            aria-label="Filter by plan"
          >
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="font-body text-sm text-[#5b57a2] hover:text-[#292673]"
            onClick={() => {
              setSearchInput("");
              onFilterChange({ search: "", plan: "all" });
            }}
          >
            <X className="mr-1 size-3" />
            Clear
          </Button>
        )}
      </div>

      <p className="font-body text-sm text-[#6b6b6b]">
        {total} {total === 1 ? "user" : "users"}
      </p>
    </div>
  );
}
