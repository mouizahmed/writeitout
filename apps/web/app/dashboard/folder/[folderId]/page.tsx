"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useFolderContext } from "@/hooks/use-folder-context";

export default function FolderPage() {
  const { currentFolderId } = useFolderContext();

  return (
    <DashboardLayout 
      currentFolderId={currentFolderId}
      showBreadcrumbs={true}
      emptyStateTitle="This folder is empty"
      emptyStateDescription="Create a new transcript or folder to get started"
    />
  );
}