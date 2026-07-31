import { ChartBar, CreditCard, Settings } from "lucide-react";

export const items = [
  {
    title: "Budgets",
    path: "/budgets",
    icon: <ChartBar className="size-4" />,
  },
  {
    title: "Transactions",
    path: "/transactions",
    icon: <CreditCard className="size-4" />,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <Settings className="size-4" />,
  },
];
