import React from "react";
import AdminSideBar from "../components/dashboard/AdminSideBar.jsx";
import Navbar from "../components/dashboard/Navbar.jsx";
import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";


const AdminDashboard = () => {
  return (
    <SidebarProvider className="max-w-full overflow-x-hidden">
      <AdminSideBar />
      <SidebarInset className="min-w-0 max-w-full overflow-x-hidden">
        <Navbar />
        <div className="min-h-[calc(100svh-4rem)] min-w-0 max-w-full">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminDashboard;
