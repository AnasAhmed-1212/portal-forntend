import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/authContext.jsx";
import SummaryCard from "./SummaryCard.jsx";
import RevenueChart from "./RevenueChart.jsx";
import { FaDollarSign, FaFileInvoice, FaFileInvoiceDollar, FaUsers, FaBox } from "react-icons/fa";
import { ArrowRight, CircleCheck, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="page-shell" aria-live="polite" aria-busy="true">
        <div className="page-container space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-80 rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-container">
      <div className="mb-7">
        <Badge variant="secondary" className="mb-3">Seller workspace</Badge>
        <h1 className="page-heading">Welcome back, {user?.name || "Seller"}</h1>
        <p className="page-description">Here is the latest activity for your digital invoicing account.</p>
        {user?.sellerId && (
          <p className="mt-2 text-sm font-medium text-primary">{user.sellerId.sellerBusinessName || "Your Company"}</p>
        )}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

      <Card className="mb-6">
        <CardHeader className="border-b">
          <CardTitle>Revenue trend</CardTitle>
          <CardDescription>Invoice revenue over the last six months.</CardDescription>
        </CardHeader>
        <CardContent><RevenueChart series={stats.revenueSeries} /></CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle><CardDescription>Common seller tasks.</CardDescription></CardHeader>
          <CardContent className="grid gap-2">
            {[
              ["/seller-dashboard/invoice/add", "Create new invoice"],
              ["/seller-dashboard/buyer/adding", "Add new buyer"],
              ["/seller-dashboard/items/add", "Add new item"],
            ].map(([to, label]) => (
              <Button key={to} asChild variant="outline" className="h-11 justify-start gap-3 px-3">
                <Link to={to}><Plus className="text-primary" />{label}<ArrowRight className="ml-auto text-muted-foreground" /></Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Account summary</CardTitle><CardDescription>Current workspace configuration.</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground"><FaFileInvoice /> Total invoices</span>
              <span className="font-semibold">{stats.totalInvoices}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground"><FaUsers /> Total buyers</span>
              <span className="font-semibold">{stats.totalBuyers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground"><FaBox /> Total items</span>
              <span className="font-semibold">{stats.totalItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">FBR token</span>
              <Badge variant={user?.sellerId?.fbrToken ? "secondary" : "outline"}>
                {user?.sellerId?.fbrToken && <CircleCheck className="size-3" />}
                {user?.sellerId?.fbrToken ? "Configured" : "Not set"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default SellerSummary;
