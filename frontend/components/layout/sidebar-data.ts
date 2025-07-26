import {
  Folder,
  Trash2,
  BookOpen,
  FileText,
  BarChart3,
  Plug,
  Settings,
  User,
  FileVideo,
  Upload,
  Home
} from 'lucide-react'
import { type SidebarData } from './types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Mouiz Ahmed',
    email: 'mouiz@example.com',
    avatar: '/avatars/user.jpg',
  },
  teams: [],
  navGroups: [
    {
      title: 'Files',
      items: [
        {
          title: 'Trash',
          url: '/dashboard/trash',
          icon: Trash2
        }
      ],
    },
    {
      title: 'Tools',
      items: [
        {
          title: 'Glossaries',
          url: '/dashboard/glossaries',
          icon: BookOpen
        },
        {
          title: 'Style guides',
          url: '/dashboard/style-guides',
          icon: FileText
        },
        {
          title: 'Analytics',
          url: '/dashboard/analytics',
          icon: BarChart3
        },
        {
          title: 'Connections',
          url: '/dashboard/connections',
          icon: Plug
        },
        {
          title: 'Settings',
          url: '/dashboard/settings',
          icon: Settings
        }
      ],
    },
  ],
}