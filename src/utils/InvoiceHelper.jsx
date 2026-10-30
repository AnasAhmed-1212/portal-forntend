import { API_BASE_URL } from "../lib/api";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { Eye, Pencil, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const requestWithFallback = (requestFactory) => requestFactory(API_BASE_URL);


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
      <Badge variant={row.status === "Published" ? "secondary" : "outline"} className={row.status === "Published" ? "text-emerald-700" : "text-amber-700"}>
        {row.status}
      </Badge>
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
    <div className="flex w-full items-center justify-center gap-1 whitespace-nowrap">
      {status === "Published" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(viewPath)}
          title="View Invoice"
        >
          <Eye /> View
        </Button>
      )}

      {status !== "Published" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(editPath)}
          title="Edit Invoice"
        >
          <Pencil /> Edit
        </Button>
      )}

      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
        title={status === "Published" ? "Try to delete published invoice" : "Delete Invoice"}
      >
        <Trash2 /> {deleting ? "Deleting..." : "Delete"}
      </Button>

      {status !== "Published" && (
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={loading || deleting}
        >
          <Send /> {loading ? "Publishing..." : "Publish"}
        </Button>
      )}
    </div>
  );
};
