"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { sidebarData } from './sidebar-data'
import Image from 'next/image'

function SidebarHeaderContent() {
  const { state } = useSidebar()
  
  if (state === 'collapsed') {
    return (
      <div className="flex items-center justify-center">
        <Image 
          src="/logo2.svg" 
          alt="WriteItOut Logo" 
          width={50}
          height={50}
          className="w-12 h-12 border border-gray-200 rounded-xl bg-white"
        />
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-sidebar-border">
      <Image 
        src="/logo2.svg" 
        alt="WriteItOut Logo" 
        width={50}
        height={50}
        className="w-12 h-12 border border-gray-200 rounded-xl bg-white"
      />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">WriteItOut</span>
        <span className="truncate text-xs text-muted-foreground">Transcription Service</span>
      </div>
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader className="bg-amber-50/20">
        <SidebarHeaderContent />
      </SidebarHeader>
      <SidebarContent className="bg-amber-50/15">
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter className="bg-amber-50/20">
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}