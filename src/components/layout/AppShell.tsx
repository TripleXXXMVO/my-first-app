"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Separator } from "@/components/ui/separator";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F6F0FF]">
        {/* Top bar with sidebar trigger */}
        <header className="flex h-14 items-center gap-3 border-b border-[#DAC0FF]/30 bg-white px-4 lg:px-6">
          <SidebarTrigger className="text-[#5b57a2] hover:bg-[#F6F0FF] hover:text-[#292673]" />
          <Separator orientation="vertical" className="h-5 bg-[#DAC0FF]/40" />
          {title && (
            <h1 className="font-heading text-lg font-semibold text-[#292673]">
              {title}
            </h1>
          )}
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
