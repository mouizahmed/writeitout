"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ChevronDown, ArrowUpDown, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/data-table";
import { 
  FileVideo,
  FileAudio,
  FileText,
  Folder,
} from "lucide-react";

export type FileItem = {
  id: string;
  name: string;
  type: "video" | "audio" | "folder" | "text";
  length?: string;
  language?: string;
  service?: string;
  tags?: string[];
  created: string;
};

const getFileIcon = (type: string) => {
  switch (type) {
    case "folder":
      return <Folder className="w-4 h-4 text-blue-500" />;
    case "video":
      return <FileVideo className="w-4 h-4 text-green-500" />;
    case "audio":
      return <FileAudio className="w-4 h-4 text-purple-500" />;
    default:
      return <FileText className="w-4 h-4 text-gray-500" />;
  }
};

const createColumns = (onFolderClick?: (folderId: string) => void): ColumnDef<FileItem>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const file = row.original;
      const isFolder = file.type === "folder";
      
      const content = (
        <div className="flex items-center space-x-3">
          {getFileIcon(file.type)}
          <span className="font-medium">{file.name}</span>
        </div>
      );

      if (isFolder && onFolderClick) {
        return (
          <button
            onClick={() => onFolderClick(file.id)}
            className="text-left hover:underline focus:outline-none"
          >
            {content}
          </button>
        );
      }

      return content;
    },
  },
  {
    accessorKey: "length",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        className="h-auto p-0 font-medium"
      >
        Length
        <ChevronDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const length = row.getValue("length") as string;
      return length ? <span className="text-muted-foreground">{length}</span> : null;
    },
  },
  {
    accessorKey: "language",
    header: "Language",
    cell: ({ row }) => {
      const language = row.getValue("language") as string;
      return language ? <span className="text-muted-foreground">{language}</span> : null;
    },
  },
  {
    accessorKey: "service",
    header: "Service",
    cell: ({ row }) => {
      const service = row.getValue("service") as string;
      return service ? <span className="text-muted-foreground">{service}</span> : null;
    },
  },
  {
    accessorKey: "tags",
    header: ({ column }) => (
      <div className="flex items-center space-x-1">
        <span>Tags</span>
        <Filter className="w-3 h-3" />
      </div>
    ),
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];
      return tags && tags.length > 0 ? (
        <span className="text-xs text-blue-600 hover:underline cursor-pointer">
          {tags[0]}
        </span>
      ) : null;
    },
  },
  {
    accessorKey: "created",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        className="h-auto p-0 font-medium"
      >
        Created
        <ChevronDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const created = row.getValue("created") as string;
      return <span className="text-muted-foreground">{created}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            sideOffset={5} 
            alignOffset={-5} 
            className="w-40" 
            avoidCollisions={true}
          >
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Download</DropdownMenuItem>
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface FilesTableProps {
  data: FileItem[];
  onSelectionChange?: (selectedFiles: FileItem[]) => void;
  onFolderClick?: (folderId: string) => void;
}

export function FilesTable({ data, onSelectionChange, onFolderClick }: FilesTableProps) {
  const columns = createColumns(onFolderClick);
  
  return (
    <div className="w-full min-w-[800px]">
      <DataTable 
        columns={columns} 
        data={data} 
        onRowSelectionChange={onSelectionChange}
      />
    </div>
  );
}