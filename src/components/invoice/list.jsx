import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";
import { invoiceColumns, InvoiceButtons } from "../../utils/InvoiceHelper.jsx";
import { customTableStyles } from "../../utils/tableStyles";
import { useAuth } from "../../context/authContext";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const REMOTE_API_BASE_URL = "https://portal-backend-dun.vercel.app";
const API_BASE_URLS = [...new Set([import.meta.env.VITE_API_URL, REMOTE_API_BASE_URL].filter(Boolean))];

const shouldFallbackToNextBase = (error) => {
  const status = error?.response?.status;
  return !error?.response || status === 404 || status >= 500;
};

const requestWithFallback = async (requestFactory) => {
  let lastError;

  for (const baseUrl of API_BASE_URLS) {
    try {
      return await requestFactory(baseUrl);
    } catch (error) {
      lastError = error;
      if (!shouldFallbackToNextBase(error) || baseUrl === API_BASE_URLS[API_BASE_URLS.length - 1]) {
        throw error;
      }
    }
  }

  throw lastError;
};

const InvoiceList = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const isAdmin = user?.role === "admin";
  const addInvoicePath = isAdmin ? "/admin-dashboard/invoice/add" : "/seller-dashboard/invoice/add";

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await requestWithFallback((baseUrl) =>
        axios.get(`${baseUrl}/api/create/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
      );

      if (response.data.success) {
        const data = (response.data.data || []).map((inv, index) => {
          const totalAmount =
            inv.items?.reduce((sum, item) => sum + (Number(item.totalValues) || 0), 0) || 0;

          return {
            ...inv,
            sno: index + 1,
            invoicesId: inv._id,
            invoiceNumber: inv.isPublished ? inv.invoiceNumber || inv?.fbrResponse?.invoiceNumber || "N/A": "",
            qrValue: inv.invoiceNumber || inv?.fbrResponse?.invoiceNumber || inv._id,
            buyerBusinessName: inv.buyerBusinessName || "N/A",
            invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-GB") : "N/A",
            amount: totalAmount.toFixed(2),
            scenarioId: inv.scenarioId || "N/A",
            status: inv.isPublished ? "Published" : "Pending",
            action: <InvoiceButtons _id={inv._id} isPublished={inv.isPublished} onInvoicePublished={fetchInvoices} />,
          };
        });
        setInvoices(data);
        setFiltered(data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setInvoices([]);
      setFiltered([]);
      setErrorMessage(error.response?.data?.error || error.response?.data?.message || "Unable to load invoices right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filterData = (e) => {
    const value = e.target.value.toLowerCase();
    const filteredList = invoices.filter(
      (inv) =>
        inv.invoiceType?.toLowerCase().includes(value) ||
        inv.buyerBusinessName?.toLowerCase().includes(value) ||
        inv.scenarioId?.toLowerCase().includes(value) ||
        inv.invoiceNumber?.toLowerCase().includes(value) ||
        inv.invoicesId?.toLowerCase().includes(value)
    );
    setFiltered(filteredList);
  };

  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const publishedCount = invoices.filter((inv) => inv.status === "Published").length;
    const unpublishedCount = invoices.length - publishedCount;

    return {
      totalRevenue,
      publishedCount,
      unpublishedCount,
      totalInvoices: invoices.length,
    };
  }, [invoices]);

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="secondary" className="mb-3">Digital invoicing</Badge>
            <h1 className="page-heading">Invoice history</h1>
            <p className="page-description">Manage and track generated sales tax invoices.</p>
          </div>
          <Button asChild size="lg" className="h-10"><Link to={addInvoicePath}><Plus />Create invoice</Link></Button>
        </div>

        <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total invoices", stats.totalInvoices, "text-foreground"],
            ["Not published", stats.unpublishedCount, "text-amber-600"],
            ["Published", stats.publishedCount, "text-emerald-600"],
            ["Revenue", `PKR ${stats.totalRevenue.toLocaleString()}`, "text-primary"],
          ].map(([label, value, color]) => (
            <Card key={label} className="gap-0 py-0"><CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
              <p className={`mt-1 text-2xl font-semibold tracking-tight ${color}`}>{value}</p>
            </CardContent></Card>
          ))}
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <CardContent className="border-b p-4">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by buyer, type, or ID..."
                className="h-10 pl-9"
                onChange={filterData}
              />
            </div>
          </CardContent>

          <CardContent className="p-2">
            <DataTable
              columns={invoiceColumns}
              data={filtered}
              pagination
              progressPending={loading}
              noDataComponent={
                <div className="py-10 text-center text-slate-500">
                  {errorMessage || "There are no records to display"}
                </div>
              }
              progressComponent={
                <div className="p-20 text-blue-600 font-bold flex flex-col items-center gap-2">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Syncing Invoices...</span>
                </div>
              }
              highlightOnHover
              customStyles={{
                ...customTableStyles,
                rows: {
                  style: {
                    minHeight: "72px",
                    "&:not(:last-of-type)": {
                      borderBottomStyle: "solid",
                      borderBottomWidth: "1px",
                      borderBottomColor: "#f1f5f9",
                    },
                  },
                },
                headCells: {
                  style: {
                    backgroundColor: "#f8fafc",
                    color: "#64748b",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  },
                },
              }}
              responsive
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceList;
