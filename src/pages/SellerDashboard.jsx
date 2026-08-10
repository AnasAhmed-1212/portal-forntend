import React from "react";
import SellerSideBar from "../components/dashboard/SellerSideBar.jsx";
import Navbar from "../components/dashboard/Navbar.jsx";
import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";


const SellerDashboard = () => {
  return (
    <SidebarProvider className="max-w-full overflow-x-hidden">
      <SellerSideBar />
      <SidebarInset className="min-w-0 max-w-full overflow-x-hidden">
        <Navbar />
        <div className="min-h-[calc(100svh-4rem)] min-w-0 max-w-full">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SellerDashboard;

