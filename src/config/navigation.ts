export interface NavItem {
  title: string
  href: string
  icon?: string
  badge?: string
  permission?: string
  moduleKey?: string
  items?: NavItem[]
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const navigationConfig: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: "LayoutDashboard",
      },
    ],
  },
  {
    title: "Core System",
    items: [
      {
        title: "User Management",
        href: "/core/users",
        icon: "Users",
        permission: "users.view",
        moduleKey: "core",
        items: [
          { title: "All Users", href: "/core/users" },
          { title: "Roles & Access", href: "/core/roles" },
          { title: "Permissions Matrix", href: "/core/permissions" },
        ],
      },
      {
        title: "Audit Logs",
        href: "/audits",
        icon: "Activity",
        moduleKey: "audits",
      },
      {
        title: "Company Documents",
        href: "/company-documents",
        icon: "FileText",
        permission: "company_documents.viewAny",
        moduleKey: "companyDocuments",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Client Directory",
        href: "/clients",
        icon: "UserCheck",
        permission: "clients.viewAny",
        moduleKey: "clients",
      },
      {
        title: "Vendor Directory",
        href: "/vendors",
        icon: "Truck",
        permission: "vendors.viewAny",
        moduleKey: "vendors",
      },
      {
        title: "Fabricator Directory",
        href: "/fabricators",
        icon: "Factory",
        permission: "fabricators.viewAny",
        moduleKey: "fabricators",
      },
      {
        title: "Expense Management",
        href: "/expenses",
        icon: "Receipt",
        permission: "expenses.viewAny",
        moduleKey: "expenses",
      },
      {
        title: "Assets & Maintenance",
        href: "/assets",
        icon: "Briefcase",
        moduleKey: "assets",
      },
    ],
  },
]
