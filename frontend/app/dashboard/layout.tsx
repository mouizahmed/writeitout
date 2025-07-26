"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { FolderTreeProvider } from "@/contexts/folder-tree-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FolderTreeProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 w-full">
          {children}
        </main>
      </SidebarProvider>
    </FolderTreeProvider>
  );
}