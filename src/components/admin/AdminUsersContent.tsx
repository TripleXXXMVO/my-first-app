"use client";

import { useAdminUsers } from "@/hooks/use-admin";
import { ADMIN_USERS_PER_PAGE } from "@/lib/admin";
import { AdminUserFilterBar } from "@/components/admin/AdminUserFilterBar";
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function AdminUsersContent() {
  const { users, total, filters, loading, error, updateFilters } = useAdminUsers();

  const totalPages = Math.ceil(total / ADMIN_USERS_PER_PAGE);
  const currentPage = filters.page;

  // Page numbers to display (up to 5 centered around current)
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription className="font-body">{error}</AlertDescription>
        </Alert>
      )}

      <AdminUserFilterBar
        filters={filters}
        onFilterChange={updateFilters}
        total={total}
      />

      <AdminUserTable users={users} loading={loading} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-body text-sm text-[#6b6b6b]">
            Page {currentPage} of {totalPages}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => updateFilters({ page: Math.max(1, currentPage - 1) })}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  aria-disabled={currentPage === 1}
                />
              </PaginationItem>
              {pages.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => updateFilters({ page })}
                    isActive={page === currentPage}
                    className="cursor-pointer font-body"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    updateFilters({ page: Math.min(totalPages, currentPage + 1) })
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  aria-disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
