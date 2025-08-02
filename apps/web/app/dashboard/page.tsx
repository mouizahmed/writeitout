"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useFolderContext } from "@/hooks/use-folder-context";

export default function Dashboard() {
  const { currentFolderId } = useFolderContext();

  return (
    <DashboardLayout 
      currentFolderId={currentFolderId}
      showBreadcrumbs={false}
      emptyStateTitle="No files yet"
      emptyStateDescription="Get started by uploading your first file for transcription"
      parentFolderName="Dashboard"
    />
  );
}