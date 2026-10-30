import { API_BASE_URL } from "../../lib/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import SummaryCard from "./SummaryCard";
import { FaFileInvoice, FaFileInvoiceDollar, FaStore, FaUserCheck, FaUsers } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const AdminSummary = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    unpublishedInvoices: 0,
    publishedInvoices: 0,
    totalInvoices: 0,
    totalSellers: 0,
    totalUsers: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [dashboardRes, usersRes, sellersRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/api/create/stats/dashboard`, { headers }),
          axios.get(`${API_BASE_URL}/api/user/all`, { headers }),
          axios.get(`${API_BASE_URL}/api/seller/`, { headers }),
        ]);

        const nextStats = {
          unpublishedInvoices: 0,
          publishedInvoices: 0,
          totalInvoices: 0,
          totalSellers: 0,
          totalUsers: 0,
          activeUsers: 0,
        };

        if (dashboardRes.status === "fulfilled" && dashboardRes.value.data?.success) {
          const data = dashboardRes.value.data.data;
          nextStats.unpublishedInvoices = data.unpublishedInvoices || 0;
          nextStats.publishedInvoices = data.publishedInvoices || 0;
          nextStats.totalInvoices = data.totalInvoices || 0;
        }

        if (usersRes.status === "fulfilled" && usersRes.value.data?.success) {
          const users = usersRes.value.data.data || [];
          nextStats.totalUsers = users.length;
          nextStats.activeUsers = users.filter((user) => user?.isActive).length;
        }

        if (sellersRes.status === "fulfilled" && sellersRes.value.data?.success) {
          const sellers = sellersRes.value.data.data || [];
          nextStats.totalSellers = sellers.length;
        }

        setStats(nextStats);
      } catch (error) {
        console.error("Error loading admin dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="page-shell" aria-live="polite" aria-busy="true">
        <div className="page-container space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-container">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge variant="secondary" className="mb-3">Administration</Badge>
          <h1 className="page-heading">Dashboard overview</h1>
          <p className="page-description">Invoices, sellers, and user activity across the portal.</p>
        </div>
        <Badge variant="outline" className="w-fit py-1.5">{stats.totalInvoices} total invoices</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          icon={<FaFileInvoice className="text-white text-2xl" />}
          text="Invoices Not Published"
          number={stats.unpublishedInvoices}
          bgColor="bg-gradient-to-br from-teal-500 to-emerald-600"
        />
        <SummaryCard
          icon={<FaFileInvoiceDollar className="text-white text-2xl" />}
          text="Published"
          number={stats.publishedInvoices}
          bgColor="bg-gradient-to-br from-red-500 to-rose-600"
        />
        <SummaryCard
          icon={<FaStore className="text-white text-2xl" />}
          text="Total Sellers"
          number={stats.totalSellers}
          bgColor="bg-gradient-to-br from-indigo-500 to-violet-600"
        />
        <SummaryCard
          icon={<FaUsers className="text-white text-2xl" />}
          text="Total Users"
          number={stats.totalUsers}
          bgColor="bg-gradient-to-br from-cyan-500 to-sky-600"
        />
        <SummaryCard
          icon={<FaUserCheck className="text-white text-2xl" />}
          text="Active Users"
          number={stats.activeUsers}
          bgColor="bg-gradient-to-br from-green-500 to-emerald-600"
        />
      </div>
      </div>
    </div>
  );
};

export default AdminSummary;
