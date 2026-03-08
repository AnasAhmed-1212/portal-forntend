import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaArrowLeft, FaDownload, FaPrint } from "react-icons/fa";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value) =>
  toNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

const extractInvoiceNumber = (data) => {
  if (!data) return "";

  const candidates = [
    data.invoiceNumber,
    data?.fbrResponse?.invoiceNumber,
    data?.fbrResponse?.invoiceNo,
    data?.fbrResponse?.data?.invoiceNumber,
    data?.fbrResponse?.validationResponse?.invoiceNumber,
    data?.fbrResponse?.invoiceStatuses?.[0]?.invoiceNumber,
  ];

  const found = candidates.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
  return found ? String(found).trim() : "";
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const fetchQrDataUrl = async (qrUrl) => {
  try {
    const response = await fetch(qrUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    return typeof dataUrl === "string" ? dataUrl : null;
  } catch {
    return null;
  }
};

const InvoicePdf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const response = await axios.get(`https://portal-backend-dun.vercel.app/api/create/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          setInvoice(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching invoice details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center mt-10">Invoice not found.</div>;
  }

  const invoiceNumber = extractInvoiceNumber(invoice) || "N/A";
  const qrValue = invoiceNumber !== "N/A" ? invoiceNumber : invoice._id;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrValue)}`;
  const invoiceDate = formatDate(invoice.invoiceDate);
  const dueDate = invoiceDate;
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  const rows = items.map((item, index) => {
    const amountExTax = toNumber(item.valueSalesExcludingST);
    const salesTax = toNumber(item.salesTaxApplicable);
    const furtherTax = toNumber(item.furtherTax);
    const discount = toNumber(item.discount);
    const tax = salesTax + furtherTax;

    return {
      sr: index + 1,
      code: item.hsCode || "",
      product: item.productDescription || "",
      uom: item.uoM || "",
      qty: toNumber(item.quantity),
      rate: item.rate || "",
      amountExTax,
      tax,
      discount,
    };
  });

  const subTotal = rows.reduce((sum, row) => sum + row.amountExTax, 0);
  const gstTotal = rows.reduce((sum, row) => sum + row.tax, 0);
  const grandTotal = subTotal + gstTotal;

  const handleDownloadPdf = async () => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(String(invoice.sellerBusinessName || "BUSINESS NAME").toUpperCase(), 14, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(invoice.sellerProvince || "", 14, 22);
    doc.text(`NTN: ${invoice.sellerNTNCNIC || ""}`, 14, 27);
    doc.line(14, 33, 196, 33);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Invoice", 14, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Inv No. ${invoiceNumber}`, 146, 42);
    doc.text(`Date: ${invoiceDate}`, 146, 48);
    doc.text(`Due Date: ${dueDate}`, 146, 54);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(invoice.buyerBusinessName || "", 14, 68);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(invoice.buyerProvince || "", 14, 74);
    doc.text(`NTN: ${invoice.buyerNTNCNIC || ""}`, 14, 80);

    autoTable(doc, {
      startY: 90,
      head: [["Sr", "Code", "Product Name", "UM", "Qty", "Rate", "Amount", "Disc", "Tax"]],
      body: rows.map((row) => [
        row.sr,
        row.code,
        row.product,
        row.uom,
        row.qty,
        row.rate,
        formatMoney(row.amountExTax),
        formatMoney(row.discount),
        formatMoney(row.tax),
      ]),
      headStyles: { fillColor: [235, 235, 235], textColor: [0, 0, 0] },
      styles: { fontSize: 8 },
      theme: "plain",
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc.lastAutoTable?.finalY || 90) + 12;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Sub Total:", 132, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(formatMoney(subTotal), 194, finalY, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text("GST:", 132, finalY + 8);
    doc.setFont("helvetica", "normal");
    doc.text(formatMoney(gstTotal), 194, finalY + 8, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total:", 132, finalY + 17);
    doc.text(`Rs. ${formatMoney(grandTotal)}`, 194, finalY + 17, { align: "right" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Digital Invoice #: ${qrValue}`, 14, finalY + 18);

    const qrDataUrl = await fetchQrDataUrl(qrUrl);
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", 156, Math.max(finalY + 26, 230), 36, 36);
    }

    doc.save(`Invoice_${invoice.invoiceRefNo || invoice._id}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-100 min-h-screen py-6 lg:py-10 px-4 mt-16 lg:mt-0">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 lg:px-8 py-6 border-b bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">Invoice Details</h1>
            <p className="text-sm opacity-90">Invoice ID: {invoice._id}</p>
            <p className="text-sm opacity-90">Invoice Number: {invoiceNumber}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(-1)}
              className="px-3 lg:px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-gray-100 flex items-center gap-2"
            >
              <FaArrowLeft className="w-3 h-3" /> Back
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-3 lg:px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-gray-100 flex items-center gap-2"
            >
              <FaDownload className="w-3 h-3" /> PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-3 lg:px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-gray-100 flex items-center gap-2"
            >
              <FaPrint className="w-3 h-3" /> Print
            </button>
          </div>
        </div>

        <div className="p-4 lg:p-10">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 lg:mb-12">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">#Invoice{invoice._id}</h2>
              <h4 className="text-sm lg:text-base">#FBR_Invoice_Number: {invoiceNumber}</h4>
              <h4 className="text-sm lg:text-base">#Invoice_Reference_No: {invoice.invoiceRefNo || invoice._id}</h4>
              <p className="text-gray-500 mt-2">Date: {invoiceDate}</p>
            </div>

            <div className="mt-4 sm:mt-0">
              <span
                className={`px-4 py-2 text-sm font-semibold rounded-full ${
                  invoice.isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {invoice.isPublished ? "Published" : "Pending"}
              </span>
              <div className="mt-4 p-2 bg-white rounded-lg border border-indigo-100">
                <img src={qrUrl} alt="Invoice QR" className="w-28 h-28" />
                <p className="text-[10px] text-slate-500 mt-1">QR: {qrValue}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-8 lg:mb-12">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Seller Information</h3>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Business:</span> {invoice.sellerBusinessName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">NTN/CNIC:</span> {invoice.sellerNTNCNIC}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Address:</span> {invoice.sellerAddress}, {invoice.sellerProvince}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Buyer Information</h3>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Business:</span> {invoice.buyerBusinessName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">NTN/CNIC:</span> {invoice.buyerNTNCNIC}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Address:</span> {invoice.buyerAddress}, {invoice.buyerProvince}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Registration:</span> {invoice.buyerRegistrationType}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 lg:px-6 py-3 lg:py-4">HS Code</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4">Description</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4">UoM</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4">Qty</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4">Value</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4">Sales Tax</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4">Further Tax</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.sr} className="hover:bg-gray-50 transition">
                    <td className="px-4 lg:px-6 py-3 lg:py-4">{row.code}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">{row.product}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">{row.uom}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">{row.qty}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">{formatMoney(row.amountExTax)}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">{formatMoney(row.tax)}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">0.00</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-right font-semibold">
                      {formatMoney(row.amountExTax + row.tax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 lg:mt-10 flex justify-end">
            <div className="w-full sm:w-80 bg-gray-50 rounded-xl p-4 lg:p-6 space-y-3 shadow-inner">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatMoney(subTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sales Tax</span>
                <span>{formatMoney(gstTotal)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-800">
                <span>Grand Total</span>
                <span>{formatMoney(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePdf;
