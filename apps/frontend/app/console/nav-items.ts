export type ConsoleNavItem = {
  href: string;
  label: string;
  description: string;
};

export const CONSOLE_NAV_ITEMS: ConsoleNavItem[] = [
  {
    href: "/console",
    label: "Dashboard",
    description: "KPIs, activity, system health, and quick shortcuts.",
  },
  {
    href: "/console/sales-pos",
    label: "Sales & POS",
    description: "Orders, cashier operations, customer actions, and payments.",
  },
  {
    href: "/console/inventory-supply",
    label: "Inventory & Supply",
    description: "Catalog, stock control, procurement, and warehouse movements.",
  },
  {
    href: "/console/reports-compliance",
    label: "Reports & Compliance",
    description: "Analytics, readings, audit trails, and export tools.",
  },
  {
    href: "/console/administration",
    label: "Administration",
    description: "Users, stores, legal settings, and access governance.",
  },
];
