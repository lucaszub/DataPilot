"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Database,
  GitMerge,
  Code,
  LayoutDashboard,
  Settings,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// --- Nav items ---

const navItems = [
  { label: "Sources", icon: Database, href: "/sources" },
  { label: "Modele", icon: GitMerge, href: "/model" },
  { label: "Explorer", icon: Code, href: "/explorer" },
  { label: "Tableaux de bord", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Parametres", icon: Settings, href: "/settings" },
] as const;

// --- App Sidebar component ---

function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <Sidebar className="border-r border-gray-200 bg-white">
      {/* Logo */}
      <SidebarHeader className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.5V21h4.5v-7.5H3zm7-9V21H14.5V4.5H10zm7 4.5V21H21.5v-12H17z"
              />
            </svg>
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">
            DataPilot
          </span>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 hover:text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                >
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer: user info + logout */}
      <SidebarFooter className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p
            className="truncate text-xs text-gray-500"
            title={user?.email ?? ""}
          >
            {user?.email ?? ""}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Se deconnecter"
            className="h-8 w-8 shrink-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

// --- Layout ---

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          {/* Mobile trigger */}
          <header className="flex h-12 items-center border-b border-gray-200 bg-white px-4 md:hidden">
            <SidebarTrigger aria-label="Ouvrir le menu" />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
