import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";
import { invoiceColumns, InvoiceButtons } from "../../utils/InvoiceHelper.jsx";
import { customTableStyles } from "../../utils/tableStyles";
import { FaPlus, FaFileExport, FaSearch } from "react-icons/fa";
import { useAuth } from "../../context/authContext";

const InvoiceList = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState([]);

  const isAdmin = user?.role === "admin";
  const addInvoicePath = isAdmin ? "/admin-dashboard/invoice/add" : "/seller-dashboard/invoice/add";

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://portal-backend-dun.vercel.app/api/create/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        const data = (response.data.data || []).map((inv, index) => {
          const totalAmount =
            inv.items?.reduce((sum, item) => sum + (Number(item.totalValues) || 0), 0) || 0;

          return {
            ...inv,
            sno: index + 1,
            invoicesId: inv._id,
            invoiceNumber: inv.invoiceNumber || inv?.fbrResponse?.invoiceNumber || "",
            qrValue: inv.invoiceNumber || inv?.fbrResponse?.invoiceNumber || inv._id,
            buyerBusinessName: inv.buyerBusinessName || "N/A",
            invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-GB") : "N/A",
            amount: totalAmount.toFixed(2),
            scenarioId: inv.scenarioId || "N/A",
            status: inv.isPublished ? "Published" : "Pending",
            action: <InvoiceButtons _id={inv._id} onInvoicePublished={fetchInvoices} />,
          };
        });
        setInvoices(data);
        setFiltered(data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
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
    <div className="p-4 lg:p-8 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight">Invoices History</h3>
            <p className="text-sm text-slate-500 mt-1">Manage and track your generated sales invoices.</p>
          </div>
          <Link
            to={addInvoicePath}
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm"
          >
            <FaPlus className="mr-2" />
            Create New Invoice
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Invoices</p>
            <h4 className="text-2xl lg:text-3xl font-black text-slate-800 mt-1">{stats.totalInvoices}</h4>
          </div>
          <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Not Published</p>
            <h4 className="text-2xl lg:text-3xl font-black text-amber-600 mt-1">{stats.unpublishedCount}</h4>
          </div>
          <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Published</p>
            <h4 className="text-2xl lg:text-3xl font-black text-green-600 mt-1">{stats.publishedCount}</h4>
          </div>
          <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
            <h4 className="text-xl lg:text-2xl font-black text-slate-800 mt-1">PKR {stats.totalRevenue.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
            <div className="relative w-full md:w-96">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <FaSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by buyer, type, or ID..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                onChange={filterData}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all w-full md:w-auto justify-center">
              <FaFileExport className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <div className="p-2">
            <DataTable
              columns={invoiceColumns}
              data={filtered}
              pagination
              progressPending={loading}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
