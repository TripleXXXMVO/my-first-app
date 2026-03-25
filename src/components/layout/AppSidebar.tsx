"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, LogOut, ClipboardList } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: ClipboardList,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const userInitials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const displayName =
    user?.user_metadata?.display_name || user?.email || "User";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/hrworks-logo.png"
            alt="hr works"
            width={140}
            height={32}
            className="h-8 w-auto shrink-0 group-data-[collapsible=icon]:hidden"
            priority
          />
          <Image
            src="/hrworks-logo.png"
            alt="hr works"
            width={32}
            height={32}
            className="hidden h-8 w-8 shrink-0 object-cover object-left group-data-[collapsible=icon]:block"
            priority
          />
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-body text-xs uppercase tracking-wider text-[#5b57a2]/60">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    tooltip={item.title}
                    className="font-body text-sm text-[#5b57a2] data-[active=true]:bg-[#DAC0FF]/40 data-[active=true]:text-[#292673]"
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={displayName}
              className="h-auto p-2 font-body"
              asChild
            >
              <Link href="/profile">
                <Avatar className="size-7 shrink-0">
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-[#DAC0FF] text-xs font-medium text-[#292673]">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-medium text-[#292673]">
                    {displayName}
                  </span>
                  <span className="truncate text-xs text-[#6b6b6b]">
                    {user?.email}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={signOut}
              className="font-body text-sm text-[#5b57a2] hover:text-red-600"
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
