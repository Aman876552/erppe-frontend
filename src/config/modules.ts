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
  vendors: {
    key: "vendors",
    name: "Vendor Directory",
    description: "Manage suppliers, contacts, GSTIN/PAN info, purchase history, and spending logs.",
    icon: "Truck",
    category: "operations",
    status: "active",
    path: "/vendors",
  },
  fabricators: {
    key: "fabricators",
    name: "Fabricator Directory",
    description: "Manage fabrication partners, contact persons, job types, and workshop profiles.",
    icon: "Factory",
    category: "operations",
    status: "active",
    path: "/fabricators",
  },
  clients: {
    key: "clients",
    name: "Client Accounts",
    description: "Manage client directory, multi-warehouse delivery locations, and Spatie compliance documents.",
    icon: "UserCheck",
    category: "business",
    status: "active",
    path: "/clients",
  },
  companyDocuments: {
    key: "companyDocuments",
    name: "Company Documents",
    description: "Manage internal & private compliance certificates, licenses, attachments, and expiry alerts.",
    icon: "FileText",
    category: "core",
    status: "active",
    path: "/company-documents",
  },
  expenses: {
    key: "expenses",
    name: "Expense Management",
    description: "Track operational expenses, category lookup tables, payment dates, and upload payment receipts.",
    icon: "Receipt",
    category: "finance",
    status: "active",
    path: "/expenses",
  },
  inventory: {
    key: "inventory",
    name: "Inventory Management",
    description: "Track raw materials, finished goods, warehouse locations, stock levels, and reorder alerts.",
    icon: "Boxes",
    category: "operations",
    status: "active",
    path: "/inventory",
  },
  products: {
    key: "products",
    name: "Product Master Catalog",
    description: "Manage product SKUs, drawings, pricing, BOM specifications, orderability, and sales counters.",
    icon: "Package",
    category: "operations",
    status: "active",
    path: "/products",
  },
  machines: {
    key: "machines",
    name: "Machine Registry",
    description: "Track industrial machinery, department assignments, vendor profiles, warranty expirations, and engineers.",
    icon: "Wrench",
    category: "operations",
    status: "active",
    path: "/machines",
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
