import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/authContext.jsx";
import SummaryCard from "./SummaryCard.jsx";
import RevenueChart from "./RevenueChart.jsx";
import { FaDollarSign, FaFileInvoice, FaFileInvoiceDollar, FaUsers, FaBox } from "react-icons/fa";

const SellerSummary = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    unpublishedInvoices: 0,
    publishedInvoices: 0,
    totalBuyers: 0,
    totalItems: 0,
    revenueSeries: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [dashboardRes, buyerRes, itemRes] = await Promise.all([
          axios.get("https://portal-backend-dun.vercel.app/api/create/stats/dashboard", { headers }),
          axios.get("https://portal-backend-dun.vercel.app/api/buyer/", { headers }),
          axios.get("https://portal-backend-dun.vercel.app/api/items/add", { headers }),
        ]);

        if (dashboardRes.data.success) {
          const data = dashboardRes.data.data;
          setStats({
            totalRevenue: data.totalRevenue || 0,
            totalInvoices: data.totalInvoices || 0,
            unpublishedInvoices: data.unpublishedInvoices || 0,
            publishedInvoices: data.publishedInvoices || 0,
            totalBuyers: buyerRes.data?.data?.length || buyerRes.data?.count || 0,
            totalItems: itemRes.data?.data?.length || 0,
            revenueSeries: data.revenueSeries || [],
          });
        }
      } catch (error) {
        console.error("Error fetching seller dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name || "Seller"}!</h1>
        <p className="text-sm text-slate-500 mt-1">Your seller account dashboard is updated dynamically.</p>
        {user?.sellerId && (
          <p className="text-sm text-blue-600 mt-1">Business: {user.sellerId.sellerBusinessName || "Your Company"}</p>
        )}
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

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-slate-800">Revenue Chart</h4>
          <div className="text-sm text-slate-500">Last 6 months</div>
        </div>
        <RevenueChart series={stats.revenueSeries} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/seller-dashboard/invoice/add" className="block p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
              + Create New Invoice
            </Link>
            <Link to="/seller-dashboard/buyer/adding" className="block p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition">
              + Add New Buyer
            </Link>
            <Link to="/seller-dashboard/items/add" className="block p-3 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition">
              + Add New Item
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><FaFileInvoice /> Total Invoices</span>
              <span className="font-medium text-slate-900">{stats.totalInvoices}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><FaUsers /> Total Buyers</span>
              <span className="font-medium text-slate-900">{stats.totalBuyers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><FaBox /> Total Items</span>
              <span className="font-medium text-slate-900">{stats.totalItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">FBR Token</span>
              <span className="font-medium text-slate-900">{user?.sellerId?.fbrToken ? "Configured" : "Not Set"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSummary;

