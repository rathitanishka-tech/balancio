export const AUTH_TOKEN_KEY = "splitwise:token";
export const DEMO_MODE_KEY = "splitwise:demo";

export const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export interface NavItem {
  label: string;
  href: string;
  icon: "dashboard" | "groups" | "expenses" | "settlements" | "analytics" | "notifications" | "settings";
}

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
      { label: "Groups", href: "/groups", icon: "groups" },
      { label: "Expenses", href: "/expenses", icon: "expenses" },
      { label: "Settlements", href: "/settlements", icon: "settlements" }
    ]
  },
  {
    title: "Insights",
    items: [{ label: "Analytics", href: "/analytics", icon: "analytics" }]
  },
  {
    title: "System",
    items: [
      { label: "Notifications", href: "/notifications", icon: "notifications" },
      { label: "Settings", href: "/settings", icon: "settings" }
    ]
  }
];
