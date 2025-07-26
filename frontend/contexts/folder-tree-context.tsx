"use client";

import { createContext, useContext, useRef, ReactNode } from 'react';

interface FolderTreeContextType {
  addFolderToTree: React.MutableRefObject<((folder: any) => void) | null>;
}

const FolderTreeContext = createContext<FolderTreeContextType | undefined>(undefined);

export function FolderTreeProvider({ children }: { children: ReactNode }) {
  const addFolderToTree = useRef<((folder: any) => void) | null>(null);

  return (
    <FolderTreeContext.Provider value={{ addFolderToTree }}>
      {children}
    </FolderTreeContext.Provider>
  );
}

export function useFolderTree() {
  const context = useContext(FolderTreeContext);
  if (context === undefined) {
    throw new Error('useFolderTree must be used within a FolderTreeProvider');
  }
  return context;
}