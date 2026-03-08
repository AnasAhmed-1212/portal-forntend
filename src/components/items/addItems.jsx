import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { FaSave, FaTimes } from "react-icons/fa";
import { useAuth } from "../../context/authContext";

const AddItems = () => {
  const { user } = useAuth();
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

  const navigate = useNavigate();
  
  // Determine navigation path based on user role
  const isAdmin = user?.role === "admin";
  const itemsListPath = isAdmin ? "/admin-dashboard/items" : "/seller-dashboard/items";
  
  // FBR token must come only from assigned seller
  const FBR_TOKEN = user?.sellerId?.fbrToken || "";

  const getFbrDate = () => {
    const d = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}${d.getFullYear()}`;
  };

  // 1. Fetch HS Codes
  useEffect(() => {
    const fetchHsCodes = async () => {
      if (!FBR_TOKEN) {
        setHsCodes([]);
        return;
      }
      try {
        setLoadingHs(true);
        const response = await axios.get("https://gw.fbr.gov.pk/pdi/v1/itemdesccode", {
          headers: { Authorization: `Bearer ${FBR_TOKEN}` },
        });
        const apiData = response.data?.data || response.data || [];
        setHsCodes(apiData.map(code => ({ value: code.hS_CODE, label: `${code.hS_CODE} - ${code.description}` })));
      } catch (error) { console.error("HS Code Error:", error); }
      finally { setLoadingHs(false); }
    };
    fetchHsCodes();
  }, [FBR_TOKEN]);

  // 2. Fetch Sale Types
  useEffect(() => {
    const fetchSaleTypes = async () => {
      if (!FBR_TOKEN) {
        setSaleTypeOptions([]);
        return;
      }
      try {
        setLoadingSaleType(true);
        const response = await axios.get("https://gw.fbr.gov.pk/pdi/v1/transtypecode", {
          headers: { Authorization: `Bearer ${FBR_TOKEN}` },
        });
        const apiData = response.data?.data || response.data || [];
        setSaleTypeOptions(apiData.map(type => ({ 
          value: type.transactioN_DESC, 
          label: type.transactioN_DESC,
          transId: type.transactioN_TYPE_ID 
        })));
      } catch (error) { console.error("Sale Type Error:", error); }
      finally { setLoadingSaleType(false); }
    };
    fetchSaleTypes();
  }, [FBR_TOKEN]);

  // 3. UOM Fetch
  useEffect(() => {
    const fetchUOM = async () => {
      if (!item.hsCode) return;
      try {
        setLoadingUom(true);
        const response = await axios.get(`https://gw.fbr.gov.pk/pdi/v2/HS_UOM?hs_code=${item.hsCode}&annexure_id=3`, {
          headers: { Authorization: `Bearer ${FBR_TOKEN}` }
        });
        const uomData = response.data?.data || response.data || [];
        const formatted = uomData.map(u => ({ value: u.description, label: u.description }));
        setUomOptions(formatted);
        if (formatted.length > 0) setItem(prev => ({ ...prev, unitOfMeasurement: formatted[0].value }));
      } catch (error) { console.error("UOM Error:", error); }
      finally { setLoadingUom(false); }
    };
    fetchUOM();
  }, [item.hsCode, FBR_TOKEN]);

  // 4. Tax Rate Fetch
  useEffect(() => {
    const fetchTaxRates = async () => {
      if (!internalSaleTypeId) return;
      try {
        setLoadingTax(true);
        const response = await axios.get(
          `https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate?date=${getFbrDate()}&transTypeId=${internalSaleTypeId}&originationSupplier=${internalSaleTypeId}`,
          { headers: { Authorization: `Bearer ${FBR_TOKEN}` } }
        );
        const apiData = response.data?.data || response.data || [];
        setTaxRateOptions(apiData.map(rate => ({ value: rate.ratE_DESC, label: rate.ratE_DESC, rateId: rate.ratE_ID })));
      } catch (error) { console.error("Tax Rate Error:", error); }
      finally { setLoadingTax(false); }
    };
    fetchTaxRates();
  }, [internalSaleTypeId, FBR_TOKEN]);

  // 5. SRO Schedule Fetch
  useEffect(() => {
    const fetchSroSchedules = async () => {
      if (!selectedRateId) { setSroScheduleOptions([]); return; }
      try {
        setLoadingSro(true);
        const response = await axios.get(
          `https://gw.fbr.gov.pk/pdi/v1/SroSchedule?rate_id=${selectedRateId}&date=${getFbrDate()}&origination_supplier_csv=1`,
          { headers: { Authorization: `Bearer ${FBR_TOKEN}` } }
        );
        const apiData = response.data?.data || response.data || [];
        setSroScheduleOptions(apiData.map(sro => ({ value: sro.srO_DESC, label: sro.srO_DESC, sroId: sro.srO_ID })));
      } catch (error) { console.error("SRO Schedule Error:", error); }
      finally { setLoadingSro(false); }
    };
    fetchSroSchedules();
  }, [selectedRateId, FBR_TOKEN]);

  // 6. SRO Item Fetch
  useEffect(() => {
    const fetchSroItems = async () => {
      if (!selectedSroId) { setSroItemOptions([]); return; }
      try {
        setLoadingSroItem(true);
        const isoDate = new Date().toISOString().split('T')[0];
        const response = await axios.get(
          `https://gw.fbr.gov.pk/pdi/v2/SROItem?date=${isoDate}&sro_id=${selectedSroId}`,
          { headers: { Authorization: `Bearer ${FBR_TOKEN}` } }
        );
        const apiData = response.data?.data || response.data || [];
        setSroItemOptions(apiData.map(si => ({ value: si.srO_ITEM_DESC, label: si.srO_ITEM_DESC })));
      } catch (error) { console.error("SRO Item Error:", error); }
      finally { setLoadingSroItem(false); }
    };
    fetchSroItems();
  }, [selectedSroId, FBR_TOKEN]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItem({ ...item, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // HANDLE TAX RATE STRINGIFICATION GENTLY
      let formattedTaxRate = item.taxRate;
      
      // Only remove '%' if it exists and it's not "Exempt"
      if (formattedTaxRate && formattedTaxRate.includes('%')) {
        formattedTaxRate = formattedTaxRate.replace('%', '');
      }

      const payload = { 
        ...item, 
        sellingPrice: Number(item.sellingPrice), 
        taxRate: formattedTaxRate // Now sends "18" or "Exempt" as a String
      };

      const response = await axios.post("https://portal-backend-dun.vercel.app/api/items/add", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) { 
        alert("Item added successfully"); 
        navigate(itemsListPath); 
      }
    } catch (error) { 
      alert(error.response?.data?.error || "Submission failed. Please check if backend expects a Number."); 
    }
  };

  const customStyles = {
    control: (base) => ({ ...base, padding: "4px", borderRadius: "10px", border: "2px solid #cbd5e1", minHeight: "48px" }),
  };

  return (
    <div className="p-4 lg:p-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 lg:p-10">
        <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">Add Item</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold mb-2 text-sm">Item Name</label>
            <input name="itemName" value={item.itemName} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg outline-none focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className="block font-semibold mb-2 text-sm">Selling Price</label>
              <input name="sellingPrice" type="number" value={item.sellingPrice} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-sm">HS Code</label>
              <Select options={hsCodes} onChange={(opt) => setItem({ ...item, hsCode: opt ? opt.value : "" })} isLoading={loadingHs} placeholder="Search HS Code..." styles={customStyles} />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2 text-sm">Unit of Measurement (UOM)</label>
            <Select options={uomOptions} value={uomOptions.find(o => o.value === item.unitOfMeasurement)} onChange={(opt) => setItem({ ...item, unitOfMeasurement: opt ? opt.value : "" })} isLoading={loadingUom} placeholder="Select UOM" styles={customStyles} isDisabled={!item.hsCode} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className="block font-semibold mb-2 text-sm">Sale Type</label>
              <Select 
                options={saleTypeOptions} 
                value={saleTypeOptions.find(o => o.value === item.itemSaleType)}
                onChange={(opt) => {
                  setItem({ ...item, itemSaleType: opt ? opt.value : "", taxRate: "", sroSchedule: "", sroItem: "" });
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
                value={taxRateOptions.find(o => o.value === item.taxRate)} 
                onChange={(opt) => {
                  setItem({ ...item, taxRate: opt ? opt.value : "", sroSchedule: "", sroItem: "" });
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
                value={sroScheduleOptions.find(o => o.value === item.sroSchedule)} 
                onChange={(opt) => {
                  setItem({ ...item, sroSchedule: opt ? opt.value : "", sroItem: "" });
                  setSelectedSroId(opt ? opt.sroId : null);
                }} 
                isLoading={loadingSro} 
                placeholder="Select SRO Schedule" 
                styles={customStyles} 
                isDisabled={!selectedRateId} 
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-sm">SRO Item</label>
              <Select 
                options={sroItemOptions} 
                value={sroItemOptions.find(o => o.value === item.sroItem)} 
                onChange={(opt) => setItem({ ...item, sroItem: opt ? opt.value : "" })} 
                isLoading={loadingSroItem} 
                placeholder="Select SRO Item" 
                styles={customStyles} 
                isDisabled={!selectedSroId} 
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold text-lg hover:scale-[1.02] transition flex items-center justify-center gap-2">
              <FaSave /> Add Item
            </button>
            <button type="button" onClick={() => navigate(itemsListPath)} className="flex-1 bg-slate-200 text-slate-800 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2">
              <FaTimes /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItems;
