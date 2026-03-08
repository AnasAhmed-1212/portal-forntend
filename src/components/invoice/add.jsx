import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import { useAuth } from "../../context/authContext";

const defaultItem = {
  itemId: "",
  productDescription: "",
  hsCode: "",
  uoM: "",
  quantity: 1,
  rate: 0,
  taxRate: 0,
  discount: 0,
  salesTaxApplicable: 0,
  extraTax: "",
  furtherTax: 0,
  valueSalesExcludingST: 0,
  totalValues: 0,
  itemSaleType: "",
  sroScheduleNo: "",
  sroItemSerialNo: "",
  fedPayable: 0,
};

const AddInvoice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [buyers, setBuyers] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const isAdmin = user?.role === "admin";
  const invoiceListPath = isAdmin ? "/admin-dashboard/invoice" : "/seller-dashboard/invoice";

  const seller = isAdmin ? sellers.find((s) => s._id === selectedSellerId) : user?.sellerId;
  const FBR_TOKEN = seller?.fbrToken || "";

  const [invoice, setInvoice] = useState({
    invoiceNumber: "",
    invoiceType: "Sale Invoice",
    invoiceDate: new Date().toISOString().slice(0, 10),
    buyerId: "",
    scenarioId: "SN001",
    invoiceRefNo: "",
    items: [{ ...defaultItem }],
  });

  const parseTaxRate = (value) => {
    if (typeof value === "number") return value;
    const parsed = parseFloat(String(value || "").replace("%", "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const scopedBuyers = useMemo(() => {
    if (!isAdmin) return buyers;
    if (!selectedSellerId) return [];
    return buyers.filter((buyer) => String(buyer.sellerId) === String(selectedSellerId));
  }, [buyers, isAdmin, selectedSellerId]);

  const scopedItems = useMemo(() => {
    if (!isAdmin) return availableItems;
    if (!selectedSellerId) return [];
    return availableItems.filter((item) => String(item.sellerId) === String(selectedSellerId));
  }, [availableItems, isAdmin, selectedSellerId]);

  const itemOptions = useMemo(
    () =>
      scopedItems.map((i) => ({
        value: i._id,
        label: i.itemName,
      })),
    [scopedItems]
  );

  const descriptionSelectStyles = useMemo(
    () => ({
      container: (base) => ({ ...base, minWidth: 170 }),
      control: (base) => ({
        ...base,
        minHeight: 36,
        height: 36,
        borderColor: "#cbd5e1",
        boxShadow: "none",
      }),
      valueContainer: (base) => ({ ...base, padding: "0 8px", height: 36 }),
      input: (base) => ({ ...base, margin: 0, padding: 0 }),
      indicatorsContainer: (base) => ({ ...base, height: 36 }),
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      menu: (base) => ({ ...base, zIndex: 9999 }),
    }),
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        if (isEditMode) setLoadingInvoice(true);

        const [buyerRes, itemRes] = await Promise.all([
          axios.get("https://portal-backend-dun.vercel.app/api/buyer/", { headers }),
          axios.get("https://portal-backend-dun.vercel.app/api/items/add", { headers }),
        ]);

        const buyersData = buyerRes.data?.success ? buyerRes.data.data : [];
        const itemsData = itemRes.data?.success ? itemRes.data.data : [];
        setBuyers(buyersData);
        setAvailableItems(itemsData);

        let sellersData = [];
        if (isAdmin) {
          const sellerRes = await axios.get("https://portal-backend-dun.vercel.app/api/seller/", { headers });
          sellersData = sellerRes.data?.success ? sellerRes.data.data : [];
          setSellers(sellersData);
        }

        if (isEditMode) {
          const invoiceRes = await axios.get(`https://portal-backend-dun.vercel.app/api/create/${id}`, { headers });
          if (!invoiceRes.data?.success) return;

          const existingInvoice = invoiceRes.data.data;
          if (existingInvoice.isPublished) {
            alert("Published invoice cannot be edited.");
            navigate(invoiceListPath);
            return;
          }

          const sellerIdValue =
            typeof existingInvoice.sellerId === "object"
              ? existingInvoice.sellerId?._id
              : existingInvoice.sellerId;

          if (isAdmin && sellerIdValue) {
            setSelectedSellerId(String(sellerIdValue));
          }

          const matchedBuyer = buyersData.find(
            (b) =>
              b.ntnNumber === existingInvoice.buyerNTNCNIC &&
              b.buyerBusinessName === existingInvoice.buyerBusinessName
          );

          const mappedItems = (existingInvoice.items || []).map((item) => {
            const qty = Number(item.quantity) || 0;
            const valueExcl = Number(item.valueSalesExcludingST) || 0;
            const discount = Number(item.discount) || 0;
            const derivedRate = qty > 0 ? (valueExcl + discount) / qty : 0;
            const matchedItem = itemsData.find(
              (it) =>
                String(it.itemName || "").trim().toLowerCase() ===
                  String(item.productDescription || "").trim().toLowerCase() &&
                String(it.hsCode || "").trim() === String(item.hsCode || "").trim()
            );

            return {
              itemId: matchedItem?._id || "",
              productDescription: item.productDescription || "",
              hsCode: item.hsCode || "",
              uoM: item.uoM || "",
              quantity: qty,
              rate: Number(derivedRate.toFixed(2)),
              taxRate: parseTaxRate(item.rate),
              discount,
              salesTaxApplicable: Number(item.salesTaxApplicable) || 0,
              extraTax: item.extraTax === "" ? "" : Number(item.extraTax) || 0,
              furtherTax: Number(item.furtherTax) || 0,
              valueSalesExcludingST: valueExcl,
              totalValues: Number(item.totalValues) || 0,
              itemSaleType: item.saleType || "",
              sroScheduleNo: item.sroScheduleNo || "",
              sroItemSerialNo: item.sroItemSerialNo || "",
              fedPayable: Number(item.fedPayable) || 0,
            };
          });

          setInvoice({
            invoiceNumber: existingInvoice.invoiceNumber || "",
            invoiceType: existingInvoice.invoiceType || "Sale Invoice",
            invoiceDate: String(existingInvoice.invoiceDate || "").slice(0, 10),
            buyerId: matchedBuyer?._id || "",
            scenarioId: existingInvoice.scenarioId || "SN001",
            invoiceRefNo: existingInvoice.invoiceRefNo || "",
            items: mappedItems.length ? mappedItems : [{ ...defaultItem }],
          });
        }
      } catch (error) {
        console.error("Data Load Error:", error);
      } finally {
        if (isEditMode) setLoadingInvoice(false);
      }
    };

    fetchData();
  }, [id, isAdmin, isEditMode, navigate, invoiceListPath]);

  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const updateItemCalculations = (items, index) => {
    const item = items[index];
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const disc = Number(item.discount) || 0;
    const taxPrc = Number(item.taxRate) || 0;
    const eTax = Number(item.extraTax) || 0;
    const fTax = Number(item.furtherTax) || 0;

    const valueExclST = qty * rate - disc;
    item.valueSalesExcludingST = Number(valueExclST.toFixed(2));

    const sTax = valueExclST * (taxPrc / 100);
    item.salesTaxApplicable = Number(sTax.toFixed(2));
    item.totalValues = Number((valueExclST + sTax + eTax + fTax).toFixed(2));

    setInvoice((prev) => ({ ...prev, items }));
  };

  const handleItemSelect = (index, selectedOption) => {
    if (!selectedOption) {
      const cleared = [...invoice.items];
      cleared[index] = { ...defaultItem };
      setInvoice((prev) => ({ ...prev, items: cleared }));
      return;
    }

    const selectedItem = scopedItems.find((i) => i._id === selectedOption.value);
    if (!selectedItem) return;

    const newItems = [...invoice.items];
    newItems[index] = {
      ...newItems[index],
      itemId: selectedItem._id,
      productDescription: selectedItem.itemName,
      hsCode: selectedItem.hsCode,
      uoM: selectedItem.unitOfMeasurement || "Units",
      rate: selectedItem.sellingPrice || 0,
      taxRate: selectedItem.taxRate || 0,
      itemSaleType: selectedItem.itemSaleType,
      sroScheduleNo: selectedItem.sroSchedule || "",
      sroItemSerialNo: selectedItem.sroItem || "",
    };
    updateItemCalculations(newItems, index);
  };

  const handleRowChange = (index, field, value) => {
    const newItems = [...invoice.items];
    newItems[index][field] = value;
    updateItemCalculations(newItems, index);
  };

  const removeItem = (index) => {
    if (invoice.items.length > 1) {
      const filtered = invoice.items.filter((_, i) => i !== index);
      setInvoice({ ...invoice, items: filtered });
    }
  };

  const addNewItem = () => {
    setInvoice({ ...invoice, items: [...invoice.items, { ...defaultItem }] });
  };

  const totals = useMemo(() => {
    return invoice.items.reduce(
      (acc, itm) => {
        acc.subtotal += Number(itm.valueSalesExcludingST) || 0;
        acc.st += Number(itm.salesTaxApplicable) || 0;
        acc.et += Number(itm.extraTax) || 0;
        acc.ft += Number(itm.furtherTax) || 0;
        acc.grand = acc.subtotal + acc.st + acc.et + acc.ft;
        return acc;
      },
      { subtotal: 0, st: 0, et: 0, ft: 0, grand: 0 }
    );
  }, [invoice.items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seller || !invoice.buyerId) return alert("Missing Seller or Buyer info");
    if (!seller.isActive) return alert("Selected seller is inactive. Please activate seller first.");

    const selectedBuyer = scopedBuyers.find((b) => b._id === invoice.buyerId);
    if (!selectedBuyer) return alert("Selected buyer is invalid for this seller.");

    const fbrPayload = {
      invoiceType: invoice.invoiceType,
      invoiceDate: new Date(invoice.invoiceDate).toISOString().split("T")[0],
      sellerBusinessName: seller.sellerBusinessName || "",
      sellerProvince: seller.sellerProvince || "",
      sellerNTNCNIC: seller.sellerNTNCNIC || "",
      sellerAddress: seller.sellerAddress || "",
      buyerNTNCNIC: selectedBuyer.ntnNumber || "",
      buyerBusinessName: selectedBuyer.buyerBusinessName || "",
      buyerProvince: selectedBuyer.province || "",
      buyerAddress: selectedBuyer.address || "",
      invoiceRefNo: invoice.invoiceRefNo || "",
      scenarioId: invoice.scenarioId || "SN001",
      buyerRegistrationType: selectedBuyer.registrationType || "Registered",
      items: invoice.items.map((itm) => {
        const valueExcl = Number(itm.valueSalesExcludingST) || 0;
        const tax = Number(itm.salesTaxApplicable) || 0;
        const extra = Number(itm.extraTax) || 0;
        const further = Number(itm.furtherTax) || 0;
        const total = valueExcl + tax + extra + further;

        return {
          hsCode: itm.hsCode || "",
          productDescription: itm.productDescription || "",
          rate: typeof itm.taxRate === "string" ? itm.taxRate : `${Number(itm.taxRate) || 0}%`,
          uoM: itm.uoM || "",
          quantity: Number(itm.quantity) || 0,
          totalValues: Number(total.toFixed(2)),
          valueSalesExcludingST: Number(valueExcl.toFixed(2)),
          fixedNotifiedValueOrRetailPrice: 0.0,
          salesTaxApplicable: Number(tax.toFixed(2)),
          extraTax: extra === 0 ? "" : Number(extra.toFixed(2)),
          furtherTax: Number(further.toFixed(2)),
          sroScheduleNo: itm.sroScheduleNo || "",
          fedPayable: Number(itm.fedPayable) || 0,
          discount: Number(itm.discount) || 0,
          salesTaxWithheldAtSource: 0,
          saleType: itm.itemSaleType || "Goods at standard rate (default)",
          sroItemSerialNo: itm.sroItemSerialNo || "",
        };
      }),
    };

    const localPayload = {
      ...fbrPayload,
      invoiceNumber: invoice.invoiceNumber || "",
      sellerId: seller?._id,
    };

    try {
      if (isEditMode) {
        await axios.put(`https://portal-backend-dun.vercel.app/api/create/${id}`, localPayload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        alert("Invoice updated successfully");
      } else {
        await axios.post("https://portal-backend-dun.vercel.app/api/create/items", localPayload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        alert("Invoice saved successfully");
      }
      navigate(invoiceListPath);
    } catch (err) {
      console.error("Payload Error:", err.response?.data || err.message);
      alert(`Error: ${err.response?.data?.error || err.response?.data?.message || "Check console for details"}`);
    }
  };

  if (loadingInvoice) {
    return (
      <div className="p-4 lg:p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading invoice...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl border border-slate-200">
        <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl lg:text-2xl font-bold text-slate-800 flex items-center gap-2">
            {isEditMode ? "Edit Invoice" : "Create Sale Invoice"}
          </h2>
        </div>

        <div className="p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Invoice Type</label>
              <input readOnly value={invoice.invoiceType} className="w-full mt-1 p-2 lg:p-3 bg-slate-100 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Buyer</label>
              <select
                required
                className="w-full mt-1 p-2 lg:p-3 border border-slate-300 rounded-lg text-sm"
                value={invoice.buyerId}
                onChange={(e) => setInvoice({ ...invoice, buyerId: e.target.value })}
              >
                <option value="">Select a Buyer</option>
                {scopedBuyers.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.buyerName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Invoice Date</label>
              <input type="date" name="invoiceDate" value={invoice.invoiceDate} onChange={handleInvoiceChange} className="w-full mt-1 p-2 lg:p-3 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Invoice Reference No</label>
              <input type="text" name="invoiceRefNo" value={invoice.invoiceRefNo} onChange={handleInvoiceChange} className="w-full mt-1 p-2 lg:p-3 border rounded-lg text-sm" placeholder="Optional Ref No" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Scenario ID</label>
              <input name="scenarioId" value={invoice.scenarioId} onChange={handleInvoiceChange} className="w-full mt-1 p-2 lg:p-3 border rounded-lg text-sm" />
            </div>
            {isAdmin && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Select Seller (FBR Token)</label>
                <select
                  required={isAdmin}
                  className="w-full mt-1 p-2 lg:p-3 border border-slate-300 rounded-lg text-sm"
                  value={selectedSellerId}
                  onChange={(e) => {
                    setSelectedSellerId(e.target.value);
                    setInvoice((prev) => ({ ...prev, buyerId: "" }));
                  }}
                >
                  <option value="">Select a Seller</option>
                  {sellers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.sellerBusinessName} {s.isActive ? "" : "(Inactive)"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="font-bold text-slate-700 text-lg">Item Details</h3>
            <button type="button" onClick={addNewItem} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition flex items-center gap-2">
              <FaPlus /> Add Item
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-[11px] min-w-[900px]">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  <th className="p-2">Description</th>
                  <th className="p-2">HS code</th>
                  <th className="p-2">UoM</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Discount</th>
                  <th className="p-2">Val (Excl ST)</th>
                  <th className="p-2">ST (%)</th>
                  <th className="p-2">ST Amt</th>
                  <th className="p-2">Extra</th>
                  <th className="p-2">Further</th>
                  <th className="p-2">Total</th>
                  <th className="p-2 text-center">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.items.map((itm, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-1 w-40">
                      <Select
                        options={itemOptions}
                        value={
                          itemOptions.find((opt) => opt.value === itm.itemId) ||
                          (itm.productDescription
                            ? { value: `manual-${idx}`, label: itm.productDescription }
                            : null)
                        }
                        onChange={(opt) => handleItemSelect(idx, opt)}
                        placeholder="Select..."
                        isClearable
                        isSearchable
                        className="text-xs"
                        styles={descriptionSelectStyles}
                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                        menuPosition="fixed"
                        noOptionsMessage={() => "No items found"}
                      />
                    </td>
                    <td className="p-1 text-slate-500">{itm.hsCode}</td>
                    <td className="p-1 text-slate-500">{itm.uoM}</td>
                    <td className="p-1"><input type="number" value={itm.quantity} onChange={(e) => handleRowChange(idx, "quantity", e.target.value)} className="w-14 border p-1 rounded text-sm" /></td>
                    <td className="p-1"><input type="number" value={itm.rate} onChange={(e) => handleRowChange(idx, "rate", e.target.value)} className="w-16 border p-1 rounded text-sm" /></td>
                    <td className="p-1"><input type="number" value={itm.discount} onChange={(e) => handleRowChange(idx, "discount", e.target.value)} className="w-14 border p-1 rounded text-sm" /></td>
                    <td className="p-1 font-medium">{itm.valueSalesExcludingST}</td>
                    <td className="p-1 text-slate-400">{itm.taxRate}%</td>
                    <td className="p-1 text-blue-600 font-bold">{itm.salesTaxApplicable}</td>
                    <td className="p-1"><input type="number" value={itm.extraTax} onChange={(e) => handleRowChange(idx, "extraTax", e.target.value)} className="w-14 border p-1 rounded text-sm" /></td>
                    <td className="p-1"><input type="number" value={itm.furtherTax} onChange={(e) => handleRowChange(idx, "furtherTax", e.target.value)} className="w-14 border p-1 rounded text-sm" /></td>
                    <td className="p-1 font-bold text-slate-900">{itm.totalValues}</td>
                    <td className="p-1 text-center">
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition p-1">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 lg:p-6 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="w-full md:w-80 lg:ml-auto space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal:</span><span className="font-bold">PKR {totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Sales Tax:</span><span className="font-bold">PKR {totals.st.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Extra Tax:</span><span className="font-bold">PKR {totals.et.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Further Tax:</span><span className="font-bold">PKR {totals.ft.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-800 text-xl">
              <span>Grand Total:</span><span className="text-blue-700">PKR {totals.grand.toFixed(2)}</span>
            </div>
            <button type="submit" className="w-full mt-4 py-3 bg-blue-700 text-white rounded-lg font-bold shadow-lg hover:bg-blue-800 transition flex items-center justify-center gap-2">
              <FaSave /> {isEditMode ? "Update Invoice" : "Save Invoice"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddInvoice;
