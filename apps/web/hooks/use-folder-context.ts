import { useParams } from 'next/navigation';

export interface FolderContextData {
  currentFolderId: string | null;
}

export function useFolderContext(): FolderContextData {
  const params = useParams();
  const currentFolderId = (params?.folderId as string) || null;
  
  return {
    currentFolderId,
  };
}