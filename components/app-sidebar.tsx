"use client"

import * as React from "react"
import {
  CircleGauge,
  Feather,
  Frame,
  HandCoins,
  Landmark,
  Map,
  PieChart,
  Receipt,
  Settings2,
  Wallet,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"

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
      name: 'Peter & Ana',

    },
    navMain: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: CircleGauge
      },
      {
        title: 'Bills',
        url: '#',
        icon: Receipt,
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
        url: '/income',
        icon: HandCoins,
      },
      {
        title: 'Budget',
        url: '/budget',
        icon: Wallet
      },
      {
        title: 'Settings',
        url: '/settings',
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

  sample.navMain.splice(3, 0, {
    title: 'Accounts',
    url: '#',
    icon: Landmark,
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
        >&nbsp;
          {/* <Logo /> */}
          <Feather />
        </Link>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sample.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sample.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
