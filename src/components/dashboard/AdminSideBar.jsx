import React from "react";
import { Building2, FlaskConical, LayoutDashboard, Users } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

const navigation = [
  { to: "/admin-dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin-dashboard/users", label: "Users", icon: Users },
  { to: "/admin-dashboard/seller", label: "Sellers", icon: Building2 },
  { to: "/admin-dashboard/sandbox", label: "FBR Sandbox", icon: FlaskConical },
];

const AdminSideBar = (props) => (
  <DashboardSidebar {...props} panelLabel="Administration portal" navigation={navigation} />
);

export default AdminSideBar;
