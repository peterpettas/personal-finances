"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/components/nav-main"
import { NavProjects } from "@/components/components/nav-projects"
import { NavUser } from "@/components/components/nav-user"
import { TeamSwitcher } from "@/components/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/components/ui/sidebar"
import { Logo } from "../icons"
import Link from "next/link"
import { fetchUpApi } from "@/lib/api"
import Account from "@/components/Account"

type AccountType = {
  id: string;
  attributes: {
    displayName: string;
    balance: {
      value: string;
    };
  };
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const [accounts, setAccounts] = React.useState<AccountType[]>([]);

  const fetchAccountId = async () => {
    const response = await fetch('/api/accounts');
    if (!response.ok) {
      console.error('Failed to fetch transactions');
      return;
    }
    const data = await response.json();
    setAccounts(data.accounts);
    
  };
  const sample = {
    user: {
      name: 'shadcn',
      email: 'm@example.com',
      avatar: '/avatars/shadcn.jpg'
    },
    navMain: [
      {
        title: 'Bills',
        url: '#',
        icon: Bot,
        items: [
          {
            title: 'Genesis',
            url: '#'
          },
          {
            title: 'Explorer',
            url: '#'
          },
          {
            title: 'Quantum',
            url: '#'
          }
        ]
      },
      {
        title: 'Income',
        url: '#',
        icon: BookOpen,
        items: [
          {
            title: 'Introduction',
            url: '#'
          },
          {
            title: 'Get Started',
            url: '#'
          },
          {
            title: 'Tutorials',
            url: '#'
          },
          {
            title: 'Changelog',
            url: '#'
          }
        ]
      },
      {
        title: 'Budget',
        url: '#',
        icon: BookOpen,
        items: [
          {
            title: 'Introduction',
            url: '#'
          },
          {
            title: 'Get Started',
            url: '#'
          },
          {
            title: 'Tutorials',
            url: '#'
          },
          {
            title: 'Changelog',
            url: '#'
          }
        ]
      },
      {
        title: 'Settings',
        url: 'settings',
        icon: Settings2
      }
    ],
    projects: [
      {
        name: 'Design Engineering',
        url: '#',
        icon: Frame
      },
      {
        name: 'Sales & Marketing',
        url: '#',
        icon: PieChart
      },
      {
        name: 'Travel',
        url: '#',
        icon: Map
      }
    ]
  };

  sample.navMain.push({
    title: 'Accounts',
    url: '#',
    icon: Settings2,
    items: accounts.map((account) => ({
      title: account.attributes.displayName,
      url: `/transactions/${account.id}`,
      desc: `$${account.attributes.balance.value}`
    }))
  });
  
  React.useEffect(() => {
    fetchAccountId();
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          className="flex items-center gap-2 font-semibold text-emerald-500"
          href="/"
        >
          <Logo />
          <span className="">P&A | PF</span>
        </Link>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sample.navMain} />
        <NavProjects projects={sample.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sample.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
