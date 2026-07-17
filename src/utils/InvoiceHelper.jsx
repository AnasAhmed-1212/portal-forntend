import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

const REMOTE_API_BASE_URL = "https://portal-backend-dun.vercel.app";
const LOCAL_API_BASE_URL = "http://localhost:2703";
const API_BASE_URLS = [...new Set([import.meta.env.VITE_API_URL, LOCAL_API_BASE_URL, REMOTE_API_BASE_URL].filter(Boolean))];

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

/* ==============================
   TABLE COLUMNS FOR INVOICE
================================ */
export const invoiceColumns = [
  { name: "S.NO", selector: (row) => row.sno, width: "70px" },
  {
    name: "QR",
    width: "100px",
    cell: (row) => {
      const qrData = row.qrValue || row.invoiceNumber || row.invoicesId;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(qrData)}`;
      return <img src={qrUrl} alt="Invoice QR" className="w-14 h-14 rounded border border-slate-200 p-0.5 bg-white" />;
    },
  },
  { name: "Invoice ID", selector: (row) => row.invoicesId, sortable: true },
  {
    name: "Invoice Number",
    selector: (row) => row.invoiceNumber,
    sortable: true,
    minWidth: "160px",
    cell: (row) => (
      <span className={`text-sm ${row.status === "Published" && row.invoiceNumber ? "font-semibold text-slate-700" : "text-slate-300"}`}>
        {row.status === "Published" && row.invoiceNumber ? row.invoiceNumber : ""}
      </span>
    ),
  },
  { name: "Buyer", selector: (row) => row.buyerBusinessName, sortable: true },
  { name: "Date", selector: (row) => row.invoiceDate, sortable: true },
  {
    name: "Status",
    selector: (row) => row.status,
    cell: (row) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold ${
          row.status === "Published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
        }`}
      >
        {row.status}
      </span>
    ),
  },
  { name: "Scenario", selector: (row) => row.scenarioId },
  { name: "Amount", selector: (row) => row.amount, right: true },
  {
    name: "Action",
    cell: (row) => row.action,
    center: true,
    width: "220px",
    minWidth: "220px",
    allowOverflow: true,
    ignoreRowClick: true,
  },
];

export const InvoiceButtons = ({ _id, isPublished = false, onInvoicePublished }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [status, setStatus] = useState(isPublished ? "Published" : "Pending");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === "admin";
  const viewPath = isAdmin ? `/admin-dashboard/invoice/view/${_id}` : `/seller-dashboard/invoice/view/${_id}`;
  const editPath = isAdmin ? `/admin-dashboard/invoice/edit/${_id}` : `/seller-dashboard/invoice/edit/${_id}`;

  useEffect(() => {
    setStatus(isPublished ? "Published" : "Pending");
  }, [isPublished]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        const response = await requestWithFallback((baseUrl) =>
          axios.get(`${baseUrl}/api/create/${_id}`, { headers })
        );

        if (response.data.success) {
          const fetchedInvoice = response.data.data;
          setInvoice(fetchedInvoice);
          setStatus(fetchedInvoice.isPublished ? "Published" : "Pending");
        }
      } catch (error) {
        console.error("Data Load Error:", error);
      }
    };
    fetchData();
  }, [_id]);

  const handleSubmit = async () => {
    if (!invoice) return alert("Invoice data not loaded yet!");

    setLoading(true);
    try {
      const response = await requestWithFallback((baseUrl) =>
        axios.post(
          `${baseUrl}/api/create/${_id}/publish`,
          {},
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        )
      );

      if (response.data.success) {
        setStatus("Published");
        if (typeof onInvoicePublished === "function") {
          onInvoicePublished(_id);
        }
        const responseText = JSON.stringify(response.data.fbrResponse || {}, null, 2);
        alert(`${response.data.message || "Invoice published successfully"}\n\nFBR API Response:\n${responseText}`);
      }
    } catch (error) {
      const apiError = error.response?.data;
      const fbrResponseText = apiError?.fbrResponse
        ? `\n\nFBR API Response:\n${JSON.stringify(apiError.fbrResponse, null, 2)}`
        : "";
      const payloadText = apiError?.requestPayload
        ? `\n\nPayload Sent:\n${JSON.stringify(apiError.requestPayload, null, 2)}`
        : "";

      alert(`${apiError?.error || "Failed to publish invoice."}${fbrResponseText}${payloadText}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this invoice?");
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const response = await requestWithFallback((baseUrl) =>
        axios.delete(`${baseUrl}/api/create/${_id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
      );

      if (response.data.success && typeof onInvoicePublished === "function") {
        onInvoicePublished(_id);
      }
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.message || `Delete failed (${error.response?.status || "network error"})`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-center gap-2 whitespace-nowrap">
      {status === "Published" && (
        <button
          onClick={() => navigate(viewPath)}
          className="px-2.5 py-1 text-xs font-semibold bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors"
          title="View Invoice"
        >
          View
        </button>
      )}

      {status !== "Published" && (
        <button
          onClick={() => navigate(editPath)}
          className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
          title="Edit Invoice"
        >
          Edit
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
          deleting
            ? "bg-red-200 text-red-500"
            : "bg-red-100 text-red-700 hover:bg-red-200"
        }`}
        title={status === "Published" ? "Try to delete published invoice" : "Delete Invoice"}
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>

      {status !== "Published" && (
        <button
          onClick={handleSubmit}
          disabled={loading || deleting}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
            loading || deleting ? "bg-gray-300 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "Publishing..." : "Publish"}
        </button>
      )}
    </div>
  );
};
