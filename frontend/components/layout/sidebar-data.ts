import {
  BookOpen,
} from 'lucide-react'
import { type SidebarData } from '@/types/sidebar'

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'Tools',
      items: [
        {
          title: 'Glossaries',
          url: '/dashboard/glossaries',
          icon: BookOpen
        },
        // {
        //   title: 'Analytics',
        //   url: '/dashboard/analytics',
        //   icon: BarChart3
        // },
        // {
        //   title: 'Connections',
        //   url: '/dashboard/connections',
        //   icon: Plug
        // },
        // {
        //   title: 'Settings',
        //   url: '/dashboard/settings',
        //   icon: Settings
        // }
      ],
    },
  ],
}