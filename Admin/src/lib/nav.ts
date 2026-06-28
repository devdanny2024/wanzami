import {
  LayoutDashboard,
  Film,
  Tv,
  CreditCard,
  FileText,
  Users,
  Wallet,
  Shield,
  BarChart3,
  Settings,
  ShieldQuestion,
  Bug,
  Mail,
  MessageCircle,
  Activity,
  Video,
  Clapperboard,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { id: string; label: string; icon: LucideIcon };
export type NavGroup = {
  id: string;
  label: string;
  defaultCollapsed?: boolean;
  items: NavItem[];
};

// Single source of truth for the admin's information architecture.
// Sidebar, breadcrumb, and command palette all read from this.
export const navGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { id: "movies", label: "Movies", icon: Film },
      { id: "series", label: "Series", icon: Tv },
      { id: "livestudio", label: "Live Studio", icon: Video },
      { id: "creatorhub", label: "Creator Hub", icon: Clapperboard },
      { id: "blog", label: "Blog", icon: FileText },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    items: [
      { id: "ppv", label: "PPV", icon: CreditCard },
      { id: "payments", label: "Payments", icon: Wallet },
      { id: "invoices", label: "Invoices", icon: CreditCard },
    ],
  },
  {
    id: "community",
    label: "Community",
    items: [
      { id: "users", label: "Users", icon: Users },
      { id: "support", label: "Support", icon: MessageCircle },
      { id: "moderation", label: "Moderation", icon: Shield },
    ],
  },
  {
    id: "system",
    label: "System",
    defaultCollapsed: true,
    items: [
      { id: "team", label: "Team", icon: ShieldQuestion },
      { id: "email", label: "Email Service", icon: Mail },
      { id: "processes", label: "Processes", icon: Activity },
      { id: "logs", label: "Logs", icon: Bug },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);

export function findNav(id: string): { group: NavGroup; item: NavItem } | null {
  for (const group of navGroups) {
    const item = group.items.find((i) => i.id === id);
    if (item) return { group, item };
  }
  return null;
}
