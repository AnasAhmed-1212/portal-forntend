import React, { useEffect, useState } from "react";
import axios from "axios";
import SummaryCard from "./SummaryCard";
import { FaFileInvoice, FaFileInvoiceDollar, FaStore, FaUserCheck, FaUsers } from "react-icons/fa";

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
          axios.get("https://portal-backend-dun.vercel.app/api/create/stats/dashboard", { headers }),
          axios.get("https://portal-backend-dun.vercel.app/api/user/all", { headers }),
          axios.get("https://portal-backend-dun.vercel.app/api/seller/", { headers }),
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
      <div className="p-6 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 min-h-screen bg-slate-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Dashboard Overview</h3>
          <p className="text-sm text-slate-500 mt-1">Invoices, sellers and user activity</p>
        </div>
        <div className="text-sm text-slate-500">
          Total invoices: <span className="font-semibold text-slate-700">{stats.totalInvoices}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
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
  );
};

export default AdminSummary;
