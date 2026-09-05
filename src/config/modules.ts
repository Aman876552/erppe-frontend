export interface ModuleMeta {
  key: string
  name: string
  description: string
  icon: string
  category: "core" | "business" | "operations" | "finance" | "hr"
  status: "active" | "inactive" | "coming_soon"
  path: string
}

export const ERP_MODULES: Record<string, ModuleMeta> = {
  core: {
    key: "core",
    name: "User & Security Core",
    description: "User accounts, role-based access control, system permissions, and audit logs.",
    icon: "ShieldCheck",
    category: "core",
    status: "active",
    path: "/core/users",
  },
  assets: {
    key: "assets",
    name: "Asset Management",
    description: "Fixed assets tracking, maintenance schedules, and depreciation.",
    icon: "Briefcase",
    category: "operations",
    status: "coming_soon",
    path: "/assets",
  },
  audits: {
    key: "audits",
    name: "System Audits",
    description: "Activity logs, compliance tracking, and security audit trails.",
    icon: "Activity",
    category: "core",
    status: "coming_soon",
    path: "/audits",
  },
}
