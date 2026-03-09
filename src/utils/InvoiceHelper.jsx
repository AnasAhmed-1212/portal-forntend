import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

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
  { name: "Action", selector: (row) => row.action, center: true, width: "170px" },
];

export const InvoiceButtons = ({ _id, onInvoicePublished }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [status, setStatus] = useState("Pending");
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin";
  const viewPath = isAdmin ? `/admin-dashboard/invoice/view/${_id}` : `/seller-dashboard/invoice/view/${_id}`;
  const editPath = isAdmin ? `/admin-dashboard/invoice/edit/${_id}` : `/seller-dashboard/invoice/edit/${_id}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        const response = await axios.get(`https://portal-backend-dun.vercel.app/api/create/${_id}`, { headers });

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

  const normalizeRegistrationNumber = (value) => String(value || "").replace(/\D/g, "");
  const isValidSellerRegistrationNumber = (value) => value.length === 7 || value.length === 13;

  const buildFbrPayload = (sourceInvoice) => ({
    invoiceType: sourceInvoice.invoiceType,
    invoiceDate: sourceInvoice.invoiceDate,
    sellerBusinessName: sourceInvoice.sellerBusinessName,
    sellerProvince: sourceInvoice.sellerProvince,
    sellerNTNCNIC: normalizeRegistrationNumber(sourceInvoice.sellerNTNCNIC),
    sellerAddress: sourceInvoice.sellerAddress,
    buyerNTNCNIC: sourceInvoice.buyerNTNCNIC,
    buyerBusinessName: sourceInvoice.buyerBusinessName,
    buyerProvince: sourceInvoice.buyerProvince,
    buyerAddress: sourceInvoice.buyerAddress,
    invoiceRefNo: sourceInvoice.invoiceRefNo || "",
    scenarioId: sourceInvoice.scenarioId,
    buyerRegistrationType: sourceInvoice.buyerRegistrationType,
    items: (sourceInvoice.items || []).map((item) => ({
      hsCode: item.hsCode,
      productDescription: item.productDescription,
      rate: item.rate,
      uoM: item.uoM,
      quantity: Number(item.quantity),
      totalValues: Number(item.totalValues),
      valueSalesExcludingST: Number(item.valueSalesExcludingST),
      fixedNotifiedValueOrRetailPrice: Number(item.fixedNotifiedValueOrRetailPrice || 0),
      salesTaxApplicable: Number(item.salesTaxApplicable || 0),
      salesTaxWithheldAtSource: Number(item.salesTaxWithheldAtSource || 0),
      extraTax: item.extraTax || "",
      furtherTax: Number(item.furtherTax || 0),
      sroScheduleNo: item.sroScheduleNo || "",
      fedPayable: Number(item.fedPayable || 0),
      discount: Number(item.discount || 0),
      saleType: item.saleType,
      sroItemSerialNo: item.sroItemSerialNo || "",
    })),
  });

  const getSellerAuthForInvoice = async () => {
    const fallbackSellerNtn = normalizeRegistrationNumber(invoice?.sellerNTNCNIC);

    if (user?.role !== "admin") {
      const sellerFromUser = user?.sellerId || {};
      return {
        fbrToken: sellerFromUser?.fbrToken || "",
        sellerNTNCNIC: normalizeRegistrationNumber(sellerFromUser?.sellerNTNCNIC || fallbackSellerNtn),
      };
    }

    const sellerId = invoice?.sellerId?._id || invoice?.sellerId;
    if (!sellerId) {
      return { fbrToken: "", sellerNTNCNIC: fallbackSellerNtn };
    }

    const response = await axios.get(`https://portal-backend-dun.vercel.app/api/seller/${sellerId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    return {
      fbrToken: response?.data?.data?.fbrToken || "",
      sellerNTNCNIC: normalizeRegistrationNumber(response?.data?.data?.sellerNTNCNIC || fallbackSellerNtn),
    };
  };

  const publishFromFrontendFallback = async (payloadFromServer = null) => {
    const sellerAuth = await getSellerAuthForInvoice();
    const fbrPayload = { ...(payloadFromServer || buildFbrPayload(invoice)) };
    fbrPayload.sellerNTNCNIC = sellerAuth.sellerNTNCNIC || normalizeRegistrationNumber(fbrPayload.sellerNTNCNIC);

    const fbrToken = sellerAuth.fbrToken;

    if (!fbrToken) {
      throw new Error("FBR token not found for this invoice seller.");
    }
    if (!isValidSellerRegistrationNumber(fbrPayload.sellerNTNCNIC)) {
      throw new Error("Seller NTN/CNIC must be exactly 7 digits (NTN) or 13 digits (CNIC). Update seller profile and try again.");
    }

    const fbrRes = await axios.post("https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata", fbrPayload, {
      headers: {
        Authorization: `Bearer ${fbrToken}`,
        "content-type": "application/json",
      },
    });

    await axios.post(
      `https://portal-backend-dun.vercel.app/api/create/${_id}/mark-published`,
      { fbrResponse: fbrRes.data, requestPayload: fbrPayload },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    return { fbrResponse: fbrRes.data, requestPayload: fbrPayload };
  };

  const handleSubmit = async () => {
    if (!invoice) return alert("Invoice data not loaded yet!");

    setLoading(true);
    try {
      const response = await axios.post(
        `https://portal-backend-dun.vercel.app/api/create/${_id}/publish`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
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
      const statusCode = String(apiError?.fbrResponse?.validationResponse?.statusCode || "");
      const validationErrorCode = String(apiError?.fbrResponse?.validationResponse?.errorCode || "");
      const fbrErrorText = String(apiError?.fbrResponse?.validationResponse?.error || "").toLowerCase();
      const isFetchFailure =
        String(apiError?.error || "").toLowerCase().includes("failed to reach fbr api") ||
        String(apiError?.validationError || "").toLowerCase().includes("fetch failed");
      const isSellerAuthMismatch =
        (statusCode === "01" || validationErrorCode === "0401") &&
        (validationErrorCode === "0401" ||
          fbrErrorText.includes("authorized token does not exist against seller registration number") ||
          fbrErrorText.includes("provided seller registration number is not 13 digits"));

      if (isFetchFailure || isSellerAuthMismatch) {
        try {
          const fallbackResult = await publishFromFrontendFallback(apiError?.requestPayload || buildFbrPayload(invoice));
          setStatus("Published");
          if (typeof onInvoicePublished === "function") {
            onInvoicePublished(_id);
          }
          alert(`Invoice published successfully (fallback mode).\n\nFBR API Response:\n${JSON.stringify(fallbackResult.fbrResponse, null, 2)}`);
          return;
        } catch (fallbackError) {
          const fbData = fallbackError?.response?.data;
          alert(
            `${fbData?.error || fallbackError.message || "Fallback publish failed."}` +
              (fbData?.fbrResponse ? `\n\nFBR API Response:\n${JSON.stringify(fbData.fbrResponse, null, 2)}` : "")
          );
          return;
        }
      }

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

  return (
    <div className="flex items-center gap-2">
      {status === "Published" && (
        <button
          onClick={() => navigate(viewPath)}
          className="px-3 py-1 text-sm font-semibold bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors"
          title="View Invoice"
        >
          View
        </button>
      )}

      {status !== "Published" && (
        <button
          onClick={() => navigate(editPath)}
          className="px-3 py-1 text-sm font-semibold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
          title="Edit Invoice"
        >
          Edit
        </button>
      )}

      {status !== "Published" && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`px-3 py-1 text-sm font-semibold rounded-lg transition-colors ${
            loading ? "bg-gray-300 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "Publishing..." : "Publish"}
        </button>
      )}
    </div>
  );
};
