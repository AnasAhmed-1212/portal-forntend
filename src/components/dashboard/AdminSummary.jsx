import React, { useEffect, useState } from "react";
import axios from "axios";
import SummaryCard from "./SummaryCard";
import RevenueChart from "./RevenueChart";
import { FaDollarSign, FaFileInvoice, FaFileInvoiceDollar } from "react-icons/fa";

const AdminSummary = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    unpublishedInvoices: 0,
    publishedInvoices: 0,
    totalInvoices: 0,
    revenueSeries: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("https://portal-backend-dun.vercel.app/api/create/stats/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const data = response.data.data;
          setStats({
            totalRevenue: data.totalRevenue || 0,
            unpublishedInvoices: data.unpublishedInvoices || 0,
            publishedInvoices: data.publishedInvoices || 0,
            totalInvoices: data.totalInvoices || 0,
            revenueSeries: data.revenueSeries || [],
          });
        }
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
          <p className="text-sm text-slate-500 mt-1">Revenue and invoice publishing status</p>
        </div>
        <div className="text-sm text-slate-500">
          Total invoices: <span className="font-semibold text-slate-700">{stats.totalInvoices}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <SummaryCard
          icon={<FaDollarSign className="text-white text-2xl" />}
          text="Total Revenue"
          number={`PKR ${Number(stats.totalRevenue || 0).toLocaleString()}`}
          bgColor="bg-gradient-to-br from-yellow-500 to-amber-600"
        />
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
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-slate-800">Revenue Chart</h4>
          <div className="text-sm text-slate-500">Last 6 months</div>
        </div>
        <RevenueChart series={stats.revenueSeries} />
      </div>
    </div>
  );
};

export default AdminSummary;

