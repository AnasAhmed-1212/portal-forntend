import React from "react";
import { Boxes, FileText, LayoutDashboard, UsersRound } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

const navigation = [
  { to: "/seller-dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/seller-dashboard/invoice", label: "Invoices", icon: FileText, end: true },
  { to: "/seller-dashboard/buyer/add/", label: "Buyers", icon: UsersRound },
  { to: "/seller-dashboard/items", label: "Items", icon: Boxes },
];

const SellerSideBar = (props) => (
  <DashboardSidebar {...props} panelLabel="Digital invoicing portal" navigation={navigation} />
);

export default SellerSideBar;
