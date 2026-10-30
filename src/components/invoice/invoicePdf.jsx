import { API_BASE_URL } from "../../lib/api";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaArrowLeft, FaDownload, FaPrint } from "react-icons/fa";
import fbrLogo from "../../assets/fbr-main-logo.png";
import { Button } from "@/components/ui/button";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value) =>
  toNumber(value).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
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

const units = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const wordsBelowThousand = (value) => {
  let number = value;
  const words = [];

  if (number >= 100) {
    words.push(`${units[Math.floor(number / 100)]} Hundred`);
    number %= 100;
  }

  if (number >= 20) {
    words.push(tens[Math.floor(number / 10)]);
    number %= 10;
  }

  if (number > 0) words.push(units[number]);
  return words.join(" ");
};

const integerToWords = (value) => {
  let number = Math.floor(Math.abs(value));
  if (number === 0) return "Zero";

  const groups = [
    { value: 10000000, label: "Crore" },
    { value: 100000, label: "Lakh" },
    { value: 1000, label: "Thousand" },
  ];
  const words = [];

  groups.forEach((group) => {
    if (number >= group.value) {
      const count = Math.floor(number / group.value);
      words.push(`${integerToWords(count)} ${group.label}`);
      number %= group.value;
    }
  });

  if (number > 0) words.push(wordsBelowThousand(number));
  return words.join(" ");
};

const amountInWords = (value) => {
  const amount = Math.max(toNumber(value), 0);
  const totalPaisa = Math.round(amount * 100);
  const rupees = Math.floor(totalPaisa / 100);
  const paisa = totalPaisa % 100;
  const paisaText = paisa ? ` and ${integerToWords(paisa)} Paisa` : "";
  return `${integerToWords(rupees)} Rupees${paisaText} Only`;
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const fetchImageDataUrl = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const dataUrl = await blobToDataUrl(await response.blob());
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
  const [errorMessage, setErrorMessage] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setErrorMessage("");
        const response = await axios.get(`${API_BASE_URL}/api/create/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          setInvoice(response.data.data);
        } else {
          setErrorMessage("Invoice not found.");
        }
      } catch (error) {
        console.error("Error fetching invoice details:", error);
        setErrorMessage(error.response?.data?.error || "Unable to load this invoice.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center mt-10 text-slate-600">{errorMessage || "Invoice not found."}</div>;
  }

  const invoiceNumber = extractInvoiceNumber(invoice) || "N/A";
  const erpInvoiceNumber = invoice.invoiceRefNo || invoice._id || "N/A";
  const qrValue = invoiceNumber !== "N/A" ? invoiceNumber : invoice._id;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrValue)}`;
  const invoiceDate = formatDate(invoice.invoiceDate);
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  const rows = items.map((item, index) => {
    const quantity = toNumber(item.quantity);
    const discount = toNumber(item.discount);
    const amountExTax = toNumber(item.valueSalesExcludingST);
    const explicitTax =
      toNumber(item.salesTaxApplicable) +
      toNumber(item.extraTax) +
      toNumber(item.furtherTax) +
      toNumber(item.fedPayable);
    const savedInclusive = Number(item.totalValues);
    const hasSavedInclusive = item.totalValues !== "" && item.totalValues !== null && item.totalValues !== undefined;
    const inclusiveValue = hasSavedInclusive && Number.isFinite(savedInclusive) ? savedInclusive : amountExTax + explicitTax;
    const taxAmount = explicitTax || Math.max(inclusiveValue - amountExTax, 0);
    const unitPrice = quantity > 0 ? (amountExTax + discount) / quantity : 0;
    const rawTaxRate = String(item.rate ?? item.taxRate ?? "0").trim();
    const taxRate = rawTaxRate.includes("%") || rawTaxRate.toLowerCase() === "exempt" ? rawTaxRate : `${rawTaxRate}%`;

    return {
      sr: index + 1,
      code: item.hsCode || "",
      product: item.productDescription || "",
      uom: item.uoM || "",
      quantity,
      unitPrice,
      amountExTax,
      taxRate,
      taxAmount,
      inclusiveValue,
    };
  });

  const subTotal = rows.reduce((sum, row) => sum + row.amountExTax, 0);
  const gstTotal = rows.reduce((sum, row) => sum + row.taxAmount, 0);
  const grandTotal = rows.reduce((sum, row) => sum + row.inclusiveValue, 0);
  const totalWords = amountInWords(grandTotal);

  const handleDownloadPdf = async () => {
    setDownloading(true);

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      const [logoDataUrl, qrDataUrl] = await Promise.all([
        fetchImageDataUrl(fbrLogo),
        fetchImageDataUrl(qrUrl),
      ]);

      doc.setTextColor(0, 0, 0);
      doc.setFillColor(24, 24, 27);
      doc.rect(pageWidth - margin - 58, 12, 58, 9, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text("SALES TAX INVOICE", pageWidth - margin - 29, 18.2, { align: "center" });
      doc.setTextColor(0, 0, 0);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Invoice Date : ${invoiceDate}`, margin + 1, 31);
      doc.text(`ERP Invoice No : ${erpInvoiceNumber}`, margin + 1, 38);
      doc.text(`FBR Invoice No : ${invoiceNumber}`, pageWidth - margin, 29, { align: "right", maxWidth: 92 });

      const detailsTop = 44;
      const detailsGap = 8;
      const detailsWidth = (contentWidth - detailsGap) / 2;
      const detailsHeight = 38;

      const drawDetailsBox = (x, title, name, ntn, address) => {
        doc.setDrawColor(30, 30, 30);
        doc.setLineWidth(0.35);
        doc.rect(x, detailsTop, detailsWidth, detailsHeight);
        doc.setFillColor(229, 231, 235);
        doc.rect(x, detailsTop, detailsWidth, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(title, x + 2, detailsTop + 4.8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.2);
        doc.text("Name :", x + 4, detailsTop + 14);
        doc.text(doc.splitTextToSize(String(name || "N/A"), detailsWidth - 28), x + 24, detailsTop + 14);
        doc.text("NTN/CNIC :", x + 4, detailsTop + 22);
        doc.text(String(ntn || "N/A"), x + 24, detailsTop + 22);
        doc.text("Address :", x + 4, detailsTop + 30);
        doc.text(doc.splitTextToSize(String(address || "N/A"), detailsWidth - 29), x + 24, detailsTop + 30);
      };

      drawDetailsBox(
        margin,
        "SUPPLIER DETAILS",
        invoice.sellerBusinessName,
        invoice.sellerNTNCNIC,
        [invoice.sellerAddress, invoice.sellerProvince].filter(Boolean).join(", ")
      );
      drawDetailsBox(
        margin + detailsWidth + detailsGap,
        "CUSTOMER DETAILS",
        invoice.buyerBusinessName,
        invoice.buyerNTNCNIC,
        [invoice.buyerAddress, invoice.buyerProvince].filter(Boolean).join(", ")
      );

      autoTable(doc, {
        startY: detailsTop + detailsHeight + 3,
        head: [["S.No", "Description", "Quantity", "UOM", "Price", "Value\nExclusive", "Tax\nRate", "Sales Tax", "Value\nInclusive"]],
        body: rows.map((row) => [
          row.sr,
          [row.code, row.product].filter(Boolean).join(" - "),
          formatMoney(row.quantity),
          row.uom,
          formatMoney(row.unitPrice),
          formatMoney(row.amountExTax),
          String(row.taxRate),
          formatMoney(row.taxAmount),
          formatMoney(row.inclusiveValue),
        ]),
        theme: "grid",
        margin: { left: margin, right: margin, bottom: 22 },
        styles: {
          font: "helvetica",
          fontSize: 7.2,
          textColor: [0, 0, 0],
          lineColor: [30, 30, 30],
          lineWidth: 0.25,
          cellPadding: 1.4,
          valign: "middle",
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [229, 231, 235],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
          minCellHeight: 10,
        },
        bodyStyles: { minCellHeight: 12 },
        columnStyles: {
          0: { cellWidth: 9, halign: "center" },
          1: { cellWidth: 47 },
          2: { cellWidth: 15, halign: "right" },
          3: { cellWidth: 15, halign: "center" },
          4: { cellWidth: 18, halign: "right" },
          5: { cellWidth: 22, halign: "right" },
          6: { cellWidth: 15, halign: "center" },
          7: { cellWidth: 21, halign: "right" },
          8: { cellWidth: 24, halign: "right" },
        },
      });

      let summaryTop = (doc.lastAutoTable?.finalY || 90) + 1;
      if (summaryTop > 221) {
        doc.addPage();
        summaryTop = 18;
      }

      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.3);
      doc.rect(margin, summaryTop, contentWidth, 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.4);
      doc.text(doc.splitTextToSize(totalWords, contentWidth - 4), margin + 2, summaryTop + 5.1);

      const brandTop = summaryTop + 14;
      if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", margin + 1, brandTop, 27, 27);
      if (qrDataUrl) doc.addImage(qrDataUrl, "PNG", margin + 33, brandTop, 28, 28);

      const totalsX = pageWidth - margin - 52;
      const totalsValueX = pageWidth - margin;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Total", totalsX, brandTop + 3);
      doc.text(formatMoney(subTotal), totalsValueX, brandTop + 3, { align: "right" });
      doc.text("GST", totalsX, brandTop + 12);
      doc.text(formatMoney(gstTotal), totalsValueX, brandTop + 12, { align: "right" });
      doc.text("Net Total", totalsX, brandTop + 22);
      doc.text(formatMoney(grandTotal), totalsValueX, brandTop + 22, { align: "right" });

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text(
        "This is a system-generated invoice and does not require any stamp or signature.",
        pageWidth / 2,
        pageHeight - 17,
        { align: "center" }
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Powered by Fileredge | +92 336 2137034", pageWidth / 2, pageHeight - 10, { align: "center" });

      doc.save(`Sales_Tax_Invoice_${erpInvoiceNumber}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 mt-16 lg:mt-0 print:m-0 print:bg-white print:p-0">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 210mm;
            min-height: 297mm;
            margin: 0 !important;
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          #invoice-print-area,
          #invoice-print-area * {
            visibility: visible !important;
          }

          #invoice-print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 12mm !important;
            box-shadow: none !important;
            color: #000000 !important;
            background: #ffffff !important;
          }

          #invoice-print-area table {
            break-inside: auto;
          }

          #invoice-print-area tr,
          #invoice-print-area .print-keep-together {
            break-inside: avoid;
          }

          #invoice-print-area thead {
            display: table-header-group;
          }
        }
      `}</style>

      <div className="mx-auto mb-4 flex w-full max-w-[210mm] flex-col gap-3 rounded-xl bg-slate-900 p-4 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-lg font-bold">Invoice Print Preview</h1>
          <p className="text-xs text-slate-300">FBR Invoice: {invoiceNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="h-3 w-3" /> Back
          </Button>
          <Button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            <FaDownload className="h-3 w-3" /> {downloading ? "Preparing..." : "Download PDF"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.print()}
          >
            <FaPrint className="h-3 w-3" /> Print
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto pb-6 print:overflow-visible print:pb-0">
        <article
          id="invoice-print-area"
          className="mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white p-[12mm] font-sans text-[10px] leading-snug text-black shadow-2xl"
        >
          <header>
            <div className="flex justify-end">
              <h2 className="bg-zinc-900 px-5 py-2 text-[15px] font-bold tracking-wide text-white">SALES TAX INVOICE</h2>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-8 text-[11px]">
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Invoice Date :</span> <span className="underline">{invoiceDate}</span>
                </p>
                <p>
                  <span className="font-semibold">ERP Invoice No :</span> <span className="underline">{erpInvoiceNumber}</span>
                </p>
              </div>
              <p className="text-right">
                <span className="font-semibold">FBR Invoice No :</span> <span className="break-all underline">{invoiceNumber}</span>
              </p>
            </div>
          </header>

          <section className="mt-3 grid grid-cols-2 gap-8">
            <div className="border border-black">
              <h3 className="bg-slate-200 px-2 py-1 text-[12px] font-bold tracking-wide">SUPPLIER DETAILS</h3>
              <dl className="grid grid-cols-[68px_1fr] gap-x-2 gap-y-3 px-4 py-4 text-[10px]">
                <dt className="font-medium">Name :</dt>
                <dd>{invoice.sellerBusinessName || "N/A"}</dd>
                <dt className="font-medium">NTN/CNIC :</dt>
                <dd>{invoice.sellerNTNCNIC || "N/A"}</dd>
                <dt className="font-medium">Address :</dt>
                <dd>{[invoice.sellerAddress, invoice.sellerProvince].filter(Boolean).join(", ") || "N/A"}</dd>
              </dl>
            </div>

            <div className="border border-black">
              <h3 className="bg-slate-200 px-2 py-1 text-[12px] font-bold tracking-wide">CUSTOMER DETAILS</h3>
              <dl className="grid grid-cols-[68px_1fr] gap-x-2 gap-y-3 px-4 py-4 text-[10px]">
                <dt className="font-medium">Name :</dt>
                <dd>{invoice.buyerBusinessName || "N/A"}</dd>
                <dt className="font-medium">NTN/CNIC :</dt>
                <dd>{invoice.buyerNTNCNIC || "N/A"}</dd>
                <dt className="font-medium">Address :</dt>
                <dd>{[invoice.buyerAddress, invoice.buyerProvince].filter(Boolean).join(", ") || "N/A"}</dd>
              </dl>
            </div>
          </section>

          <section className="mt-3">
            <table className="w-full table-fixed border-collapse text-[8px]">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[26%]" />
                <col className="w-[9%]" />
                <col className="w-[8%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead className="bg-slate-200">
                <tr>
                  {["S.No", "Description", "Quantity", "UOM", "Price", "Value Exclusive", "Tax Rate", "Sales Tax", "Value Inclusive"].map(
                    (heading) => (
                      <th key={heading} className="border border-black px-1 py-2 text-center font-bold">
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row) => (
                    <tr key={row.sr}>
                      <td className="border border-black px-1 py-3 text-center">{row.sr}</td>
                      <td className="border border-black px-1.5 py-3">
                        {[row.code, row.product].filter(Boolean).join(" - ")}
                      </td>
                      <td className="border border-black px-1 py-3 text-right">{formatMoney(row.quantity)}</td>
                      <td className="border border-black px-1 py-3 text-center break-words">{row.uom}</td>
                      <td className="border border-black px-1 py-3 text-right">{formatMoney(row.unitPrice)}</td>
                      <td className="border border-black px-1 py-3 text-right">{formatMoney(row.amountExTax)}</td>
                      <td className="border border-black px-1 py-3 text-center">{row.taxRate}</td>
                      <td className="border border-black px-1 py-3 text-right">{formatMoney(row.taxAmount)}</td>
                      <td className="border border-black px-1 py-3 text-right">{formatMoney(row.inclusiveValue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="border border-black px-3 py-8 text-center text-slate-500">
                      No invoice items available.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="font-bold">
                <tr>
                  <td colSpan="5" className="border border-black px-2 py-1.5 text-[8px] font-normal">
                    {totalWords}
                  </td>
                  <td className="border border-black px-1 py-1.5 text-right">{formatMoney(subTotal)}</td>
                  <td className="border border-black" />
                  <td className="border border-black px-1 py-1.5 text-right">{formatMoney(gstTotal)}</td>
                  <td className="border border-black px-1 py-1.5 text-right">{formatMoney(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section className="print-keep-together mt-4 flex items-start justify-between">
            <div className="flex items-center gap-5">
              <img src={fbrLogo} alt="FBR Digital Invoicing System" className="h-[29mm] w-[29mm] object-contain" />
              <div className="text-center">
                <img src={qrUrl} alt={`QR code for FBR invoice ${qrValue}`} className="h-[28mm] w-[28mm]" />
                <p className="mt-1 max-w-[35mm] break-all text-[6px] text-slate-600">{qrValue}</p>
              </div>
            </div>

            <dl className="grid min-w-[60mm] grid-cols-[1fr_30mm] gap-x-5 gap-y-3 text-[11px] font-bold">
              <dt>Total</dt>
              <dd className="text-right">{formatMoney(subTotal)}</dd>
              <dt>GST</dt>
              <dd className="text-right">{formatMoney(gstTotal)}</dd>
              <dt>Net Total</dt>
              <dd className="text-right">{formatMoney(grandTotal)}</dd>
            </dl>
          </section>

          <footer className="mt-auto pt-16 text-center">
            <p className="text-[9px] italic">This is a system-generated invoice and does not require any stamp or signature.</p>
            <p className="mt-3 text-[10px]">Powered by Fileredge | +92 336 2137034</p>
          </footer>
        </article>
      </div>
    </div>
  );
};

export default InvoicePdf;
