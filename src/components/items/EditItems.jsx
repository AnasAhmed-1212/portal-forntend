import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { FaSave, FaTimes } from "react-icons/fa";
import { useAuth } from "../../context/authContext.jsx";

const EditItems = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const itemsListPath = isAdmin ? "/admin-dashboard/items" : "/seller-dashboard/items";
  const FBR_TOKEN = user?.sellerId?.fbrToken || "";

  const [item, setItem] = useState({
    itemName: "",
    sellingPrice: "",
    hsCode: "",
    unitOfMeasurement: "",
    itemSaleType: "",
    taxRate: "",
    sroSchedule: "",
    sroItem: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [internalSaleTypeId, setInternalSaleTypeId] = useState(null);
  const [selectedRateId, setSelectedRateId] = useState(null);
  const [selectedSroId, setSelectedSroId] = useState(null);

  const [hsCodes, setHsCodes] = useState([]);
  const [uomOptions, setUomOptions] = useState([]);
  const [saleTypeOptions, setSaleTypeOptions] = useState([]);
  const [taxRateOptions, setTaxRateOptions] = useState([]);
  const [sroScheduleOptions, setSroScheduleOptions] = useState([]);
  const [sroItemOptions, setSroItemOptions] = useState([]);

  const [loadingHs, setLoadingHs] = useState(false);
  const [loadingUom, setLoadingUom] = useState(false);
  const [loadingSaleType, setLoadingSaleType] = useState(false);
  const [loadingTax, setLoadingTax] = useState(false);
  const [loadingSro, setLoadingSro] = useState(false);
  const [loadingSroItem, setLoadingSroItem] = useState(false);

  const getFbrDate = () => {
    const d = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}${d.getFullYear()}`;
  };

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`https://portal-backend-dun.vercel.app/api/items/item/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (response.data.success) {
          const data = response.data.data || {};
          setItem({
            itemName: data.itemName || "",
            sellingPrice: data.sellingPrice ?? "",
            hsCode: data.hsCode || "",
            unitOfMeasurement: data.unitOfMeasurement || "",
            itemSaleType: data.itemSaleType || "",
            taxRate: String(data.taxRate || ""),
            sroSchedule: data.sroSchedule || "",
            sroItem: data.sroItem || "",
          });
        }
      } catch (error) {
        console.error("Fetch error:", error.response || error);
        alert(error.response?.data?.error || "Error fetching item");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  useEffect(() => {
    const fetchHsCodes = async () => {
      if (!FBR_TOKEN) return;
      try {
        setLoadingHs(true);
        const response = await axios.get("https://gw.fbr.gov.pk/pdi/v1/itemdesccode", {
          headers: { Authorization: `Bearer ${FBR_TOKEN}` },
        });
        const apiData = response.data?.data || response.data || [];
        setHsCodes(apiData.map((code) => ({ value: code.hS_CODE, label: `${code.hS_CODE} - ${code.description}` })));
      } catch (error) {
        console.error("HS Code Error:", error);
      } finally {
        setLoadingHs(false);
      }
    };

    fetchHsCodes();
  }, [FBR_TOKEN]);

  useEffect(() => {
    const fetchSaleTypes = async () => {
      if (!FBR_TOKEN) return;
      try {
        setLoadingSaleType(true);
        const response = await axios.get("https://gw.fbr.gov.pk/pdi/v1/transtypecode", {
          headers: { Authorization: `Bearer ${FBR_TOKEN}` },
        });
        const apiData = response.data?.data || response.data || [];
        setSaleTypeOptions(
          apiData.map((type) => ({
            value: type.transactioN_DESC,
            label: type.transactioN_DESC,
            transId: type.transactioN_TYPE_ID,
          }))
        );
      } catch (error) {
        console.error("Sale Type Error:", error);
      } finally {
        setLoadingSaleType(false);
      }
    };

    fetchSaleTypes();
  }, [FBR_TOKEN]);

  useEffect(() => {
    if (!item.itemSaleType || !saleTypeOptions.length) return;
    const matched = saleTypeOptions.find((opt) => opt.value === item.itemSaleType);
    if (matched?.transId && matched.transId !== internalSaleTypeId) {
      setInternalSaleTypeId(matched.transId);
    }
  }, [item.itemSaleType, saleTypeOptions, internalSaleTypeId]);

  useEffect(() => {
    const fetchUOM = async () => {
      if (!item.hsCode || !FBR_TOKEN) return;
      try {
        setLoadingUom(true);
        const response = await axios.get(
          `https://gw.fbr.gov.pk/pdi/v2/HS_UOM?hs_code=${item.hsCode}&annexure_id=3`,
          { headers: { Authorization: `Bearer ${FBR_TOKEN}` } }
        );
        const uomData = response.data?.data || response.data || [];
        const formatted = uomData.map((u) => ({ value: u.description, label: u.description }));
        setUomOptions(formatted);

        if (!item.unitOfMeasurement && formatted.length > 0) {
          setItem((prev) => ({ ...prev, unitOfMeasurement: formatted[0].value }));
        }
      } catch (error) {
        console.error("UOM Error:", error);
      } finally {
        setLoadingUom(false);
      }
    };

    fetchUOM();
  }, [item.hsCode, FBR_TOKEN, item.unitOfMeasurement]);

  useEffect(() => {
    const fetchTaxRates = async () => {
      if (!internalSaleTypeId || !FBR_TOKEN) return;
      try {
        setLoadingTax(true);
        const response = await axios.get(
          `https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate?date=${getFbrDate()}&transTypeId=${internalSaleTypeId}&originationSupplier=${internalSaleTypeId}`,
          { headers: { Authorization: `Bearer ${FBR_TOKEN}` } }
        );
        const apiData = response.data?.data || response.data || [];
        setTaxRateOptions(
          apiData.map((rate) => ({
            value: rate.ratE_DESC,
            label: rate.ratE_DESC,
            rateId: rate.ratE_ID,
          }))
        );
      } catch (error) {
        console.error("Tax Rate Error:", error);
      } finally {
        setLoadingTax(false);
      }
    };

    fetchTaxRates();
  }, [internalSaleTypeId, FBR_TOKEN]);

  useEffect(() => {
    const fetchSroSchedules = async () => {
      if (!selectedRateId || !FBR_TOKEN) {
        setSroScheduleOptions([]);
        return;
      }
      try {
        setLoadingSro(true);
        const response = await axios.get(
          `https://gw.fbr.gov.pk/pdi/v1/SroSchedule?rate_id=${selectedRateId}&date=${getFbrDate()}&origination_supplier_csv=1`,
          { headers: { Authorization: `Bearer ${FBR_TOKEN}` } }
        );
        const apiData = response.data?.data || response.data || [];
        setSroScheduleOptions(
          apiData.map((sro) => ({
            value: sro.srO_DESC,
            label: sro.srO_DESC,
            sroId: sro.srO_ID,
          }))
        );
      } catch (error) {
        console.error("SRO Schedule Error:", error);
      } finally {
        setLoadingSro(false);
      }
    };

    fetchSroSchedules();
  }, [selectedRateId, FBR_TOKEN]);

  useEffect(() => {
    const fetchSroItems = async () => {
      if (!selectedSroId || !FBR_TOKEN) {
        setSroItemOptions([]);
        return;
      }
      try {
        setLoadingSroItem(true);
        const isoDate = new Date().toISOString().split("T")[0];
        const response = await axios.get(`https://gw.fbr.gov.pk/pdi/v2/SROItem?date=${isoDate}&sro_id=${selectedSroId}`, {
          headers: { Authorization: `Bearer ${FBR_TOKEN}` },
        });
        const apiData = response.data?.data || response.data || [];
        setSroItemOptions(apiData.map((si) => ({ value: si.srO_ITEM_DESC, label: si.srO_ITEM_DESC })));
      } catch (error) {
        console.error("SRO Item Error:", error);
      } finally {
        setLoadingSroItem(false);
      }
    };

    fetchSroItems();
  }, [selectedSroId, FBR_TOKEN]);

  const customStyles = useMemo(
    () => ({
      control: (base) => ({
        ...base,
        padding: "4px",
        borderRadius: "10px",
        border: "2px solid #cbd5e1",
        minHeight: "48px",
      }),
    }),
    []
  );

  const selectedHsCode = hsCodes.find((o) => o.value === item.hsCode) || (item.hsCode ? { value: item.hsCode, label: item.hsCode } : null);
  const selectedUom = uomOptions.find((o) => o.value === item.unitOfMeasurement) || (item.unitOfMeasurement ? { value: item.unitOfMeasurement, label: item.unitOfMeasurement } : null);
  const selectedSaleType = saleTypeOptions.find((o) => o.value === item.itemSaleType) || (item.itemSaleType ? { value: item.itemSaleType, label: item.itemSaleType } : null);
  const selectedTaxRate = taxRateOptions.find((o) => o.value === item.taxRate) || (item.taxRate ? { value: item.taxRate, label: item.taxRate } : null);
  const selectedSroSchedule = sroScheduleOptions.find((o) => o.value === item.sroSchedule) || (item.sroSchedule ? { value: item.sroSchedule, label: item.sroSchedule } : null);
  const selectedSroItem = sroItemOptions.find((o) => o.value === item.sroItem) || (item.sroItem ? { value: item.sroItem, label: item.sroItem } : null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const sellingPrice = Number(item.sellingPrice);
    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      alert("Please enter a valid selling price.");
      return;
    }

    let formattedTaxRate = String(item.taxRate || "").trim();
    if (formattedTaxRate.includes("%")) {
      formattedTaxRate = formattedTaxRate.replace("%", "").trim();
    }

    const payload = {
      itemName: String(item.itemName || "").trim(),
      sellingPrice,
      hsCode: String(item.hsCode || "").trim(),
      unitOfMeasurement: String(item.unitOfMeasurement || "").trim(),
      itemSaleType: String(item.itemSaleType || "").trim(),
      taxRate: formattedTaxRate,
      sroSchedule: String(item.sroSchedule || "").trim(),
      sroItem: String(item.sroItem || "").trim(),
    };

    if (!payload.itemName || !payload.hsCode || !payload.unitOfMeasurement || !payload.itemSaleType || !payload.taxRate) {
      alert("Please fill all required fields.");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put(`https://portal-backend-dun.vercel.app/api/items/item/${id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        alert("Item updated successfully");
        navigate(itemsListPath);
      }
    } catch (error) {
      console.error("Update error:", error.response || error);
      alert(error.response?.data?.error || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 lg:p-10">
        <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Edit Item
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold mb-2 text-sm">Item Name</label>
            <input
              name="itemName"
              value={item.itemName}
              onChange={(e) => setItem((prev) => ({ ...prev, itemName: e.target.value }))}
              required
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className="block font-semibold mb-2 text-sm">Selling Price</label>
              <input
                name="sellingPrice"
                type="number"
                value={item.sellingPrice}
                onChange={(e) => setItem((prev) => ({ ...prev, sellingPrice: e.target.value }))}
                required
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-sm">HS Code</label>
              <Select
                options={hsCodes}
                value={selectedHsCode}
                onChange={(opt) =>
                  setItem((prev) => ({
                    ...prev,
                    hsCode: opt ? opt.value : "",
                    unitOfMeasurement: "",
                  }))
                }
                isLoading={loadingHs}
                placeholder="Search HS Code..."
                styles={customStyles}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2 text-sm">Unit of Measurement (UOM)</label>
            <Select
              options={uomOptions}
              value={selectedUom}
              onChange={(opt) => setItem((prev) => ({ ...prev, unitOfMeasurement: opt ? opt.value : "" }))}
              isLoading={loadingUom}
              placeholder="Select UOM"
              styles={customStyles}
              isDisabled={!item.hsCode}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className="block font-semibold mb-2 text-sm">Sale Type</label>
              <Select
                options={saleTypeOptions}
                value={selectedSaleType}
                onChange={(opt) => {
                  setItem((prev) => ({
                    ...prev,
                    itemSaleType: opt ? opt.value : "",
                    taxRate: "",
                    sroSchedule: "",
                    sroItem: "",
                  }));
                  setInternalSaleTypeId(opt ? opt.transId : null);
                  setSelectedRateId(null);
                  setSelectedSroId(null);
                }}
                isLoading={loadingSaleType}
                placeholder="Select Sale Type..."
                styles={customStyles}
                isSearchable
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-sm">Tax Rate (%)</label>
              <Select
                options={taxRateOptions}
                value={selectedTaxRate}
                onChange={(opt) => {
                  setItem((prev) => ({
                    ...prev,
                    taxRate: opt ? opt.value : "",
                    sroSchedule: "",
                    sroItem: "",
                  }));
                  setSelectedRateId(opt ? opt.rateId : null);
                  setSelectedSroId(null);
                }}
                isLoading={loadingTax}
                placeholder="Select Tax Rate"
                styles={customStyles}
                isDisabled={!internalSaleTypeId}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className="block font-semibold mb-2 text-sm">SRO Schedule</label>
              <Select
                options={sroScheduleOptions}
                value={selectedSroSchedule}
                onChange={(opt) => {
                  setItem((prev) => ({
                    ...prev,
                    sroSchedule: opt ? opt.value : "",
                    sroItem: "",
                  }));
                  setSelectedSroId(opt ? opt.sroId : null);
                }}
                isLoading={loadingSro}
                placeholder="Select SRO Schedule"
                styles={customStyles}
                isDisabled={!selectedRateId && !item.sroSchedule}
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-sm">SRO Item</label>
              <Select
                options={sroItemOptions}
                value={selectedSroItem}
                onChange={(opt) => setItem((prev) => ({ ...prev, sroItem: opt ? opt.value : "" }))}
                isLoading={loadingSroItem}
                placeholder="Select SRO Item"
                styles={customStyles}
                isDisabled={!selectedSroId && !item.sroItem}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold text-lg hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FaSave /> {saving ? "Updating..." : "Update Item"}
            </button>
            <button
              type="button"
              onClick={() => navigate(itemsListPath)}
              className="flex-1 bg-slate-200 text-slate-800 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItems;
