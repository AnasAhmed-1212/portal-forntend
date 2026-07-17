import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FaCheckCircle,
  FaFlask,
  FaLock,
  FaPlus,
  FaRedo,
  FaSave,
  FaSpinner,
  FaTimesCircle,
  FaTrash,
} from "react-icons/fa";
import { sandboxScenarios } from "./sandboxScenarios.js";

const API_BASE_URL = "https://portal-backend-dun.vercel.app";
const provinces = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu and Kashmir",
];

const emptySeller = {
  sellerNTNCNIC: "",
  sellerBusinessName: "",
  sellerProvince: "Sindh",
  sellerAddress: "",
  sandboxToken: "",
};

const emptyBuyer = {
  buyerNTNCNIC: "",
  buyerBusinessName: "",
  buyerProvince: "Sindh",
  buyerAddress: "",
  buyerRegistrationType: "Registered",
  invoiceRefNo: "",
};

const itemFields = [
  ["hsCode", "HS Code", "text"],
  ["productDescription", "Product Description", "text"],
  ["rate", "Rate", "text"],
  ["uoM", "Unit of Measure", "text"],
  ["quantity", "Quantity", "number"],
  ["totalValues", "Total Values", "number"],
  ["valueSalesExcludingST", "Value Excluding ST", "number"],
  ["fixedNotifiedValueOrRetailPrice", "Fixed/Retail Price", "number"],
  ["salesTaxApplicable", "Sales Tax Applicable", "number"],
  ["salesTaxWithheldAtSource", "ST Withheld at Source", "number"],
  ["extraTax", "Extra Tax", "number"],
  ["furtherTax", "Further Tax", "number"],
  ["fedPayable", "FED Payable", "number"],
  ["discount", "Discount", "number"],
  ["sroScheduleNo", "SRO Schedule No", "text"],
  ["sroItemSerialNo", "SRO Item Serial No", "text"],
];

const petroleumProductDescriptions = [
  "H.O.B.C (97 RON) & MS(95 RON)",
  "Motor Gasoline/ Motor Spirit (92 RON)",
];

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

const readableMessage = (value) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(readableMessage).filter(Boolean).join("; ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return "";
};

const responseMessage = (error, fallback) => {
  if (error.response?.status === 404 && String(error.config?.url || "").includes("/api/sandbox")) {
    return "Sandbox backend API not found (404). Deploy the updated server before using this page.";
  }
  return (
    readableMessage(error.response?.data?.error) ||
    readableMessage(error.response?.data?.message) ||
    readableMessage(error.message) ||
    fallback
  );
};

const SandboxPanel = () => {
  const [sandboxSellers, setSandboxSellers] = useState([]);
  const [sandboxBuyers, setSandboxBuyers] = useState([]);
  const scenarios = sandboxScenarios;
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const [selectedScenarioId, setSelectedScenarioId] = useState("SN001");
  const [sellerForm, setSellerForm] = useState(emptySeller);
  const [buyerForm, setBuyerForm] = useState(emptyBuyer);
  const [itemForm, setItemForm] = useState(sandboxScenarios[0].item);
  const [scenarioResults, setScenarioResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyerLoading, setBuyerLoading] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [notice, setNotice] = useState(null);
  const [lastExchange, setLastExchange] = useState(null);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` }),
    []
  );

  const selectedSeller = useMemo(
    () => sandboxSellers.find((seller) => seller._id === selectedSellerId) || null,
    [sandboxSellers, selectedSellerId]
  );
  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId),
    [scenarios, selectedScenarioId]
  );
  const resultByScenario = useMemo(
    () => Object.fromEntries(scenarioResults.map((result) => [result.scenarioId, result])),
    [scenarioResults]
  );

  const applySeller = useCallback((seller) => {
    setSelectedSellerId(seller._id);
    setSandboxBuyers([]);
    setSelectedBuyerId("");
    setBuyerForm((current) => ({
      ...emptyBuyer,
      buyerRegistrationType: current.buyerRegistrationType,
    }));
    setSellerForm({
      sellerNTNCNIC: seller.sellerNTNCNIC || "",
      sellerBusinessName: seller.sellerBusinessName || "",
      sellerProvince: seller.sellerProvince || "Sindh",
      sellerAddress: seller.sellerAddress || "",
      sandboxToken: "",
    });
    setScenarioResults(seller.scenarioResults || []);
    setNotice(null);
    setLastExchange(null);
  }, []);

  const applyBuyer = useCallback((buyer) => {
    setSelectedBuyerId(buyer._id);
    setBuyerForm({
      buyerNTNCNIC: buyer.buyerNTNCNIC || "",
      buyerBusinessName: buyer.buyerBusinessName || "",
      buyerProvince: buyer.buyerProvince || "Sindh",
      buyerAddress: buyer.buyerAddress || "",
      buyerRegistrationType: buyer.buyerRegistrationType || "Registered",
      invoiceRefNo: buyer.invoiceRefNo || "",
    });
    setNotice(null);
    setLastExchange(null);
  }, []);

  useEffect(() => {
    const loadSandbox = async () => {
      try {
        const sellerResponse = await axios.get(`${API_BASE_URL}/api/sandbox/sellers`, { headers });
        const loadedSellers = sellerResponse.data.data || [];
        setSandboxSellers(loadedSellers);
        if (loadedSellers[0]) applySeller(loadedSellers[0]);
      } catch (error) {
        setNotice({ type: "error", text: responseMessage(error, "Unable to load sandbox") });
      } finally {
        setLoading(false);
      }
    };
    loadSandbox();
  }, [applySeller, headers]);

  useEffect(() => {
    let active = true;
    if (!selectedSellerId) {
      setSandboxBuyers([]);
      setSelectedBuyerId("");
      setBuyerLoading(false);
      return undefined;
    }

    const loadBuyers = async () => {
      setBuyerLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/sandbox/sellers/${selectedSellerId}/buyers`,
          { headers }
        );
        if (!active) return;
        const loadedBuyers = response.data.data || [];
        setSandboxBuyers(loadedBuyers);
        if (loadedBuyers[0]) applyBuyer(loadedBuyers[0]);
      } catch (error) {
        if (active) {
          setNotice({ type: "error", text: responseMessage(error, "Unable to load sandbox buyers") });
        }
      } finally {
        if (active) setBuyerLoading(false);
      }
    };

    loadBuyers();
    return () => {
      active = false;
    };
  }, [applyBuyer, headers, selectedSellerId]);

  const startNewSeller = () => {
    setSelectedSellerId("");
    setSandboxBuyers([]);
    setSelectedBuyerId("");
    setSellerForm(emptySeller);
    setBuyerForm(emptyBuyer);
    setScenarioResults([]);
    setNotice(null);
    setLastExchange(null);
  };

  const startNewBuyer = () => {
    setSelectedBuyerId("");
    setBuyerForm({
      ...emptyBuyer,
      buyerRegistrationType: selectedScenario?.buyerRegistrationType || "Registered",
    });
    setNotice(null);
    setLastExchange(null);
  };

  const replaceSeller = (updatedSeller) => {
    setSandboxSellers((current) => {
      const exists = current.some((seller) => seller._id === updatedSeller._id);
      return exists
        ? current.map((seller) => seller._id === updatedSeller._id ? updatedSeller : seller)
        : [updatedSeller, ...current];
    });
  };

  const assignSeller = async () => {
    setBusyAction("assign");
    setNotice(null);
    try {
      const response = selectedSellerId
        ? await axios.put(`${API_BASE_URL}/api/sandbox/sellers/${selectedSellerId}`, sellerForm, { headers })
        : await axios.post(`${API_BASE_URL}/api/sandbox/sellers`, sellerForm, { headers });
      const assignedSeller = response.data.data;
      replaceSeller(assignedSeller);
      applySeller(assignedSeller);
      setNotice({ type: "success", text: response.data.message || "Sandbox seller assigned." });
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to assign sandbox seller") });
    } finally {
      setBusyAction("");
    }
  };

  const deleteSeller = async () => {
    if (!selectedSellerId || !window.confirm("Remove this sandbox seller and all scenario progress?")) return;
    setBusyAction("delete");
    setNotice(null);
    try {
      await axios.delete(`${API_BASE_URL}/api/sandbox/sellers/${selectedSellerId}`, { headers });
      const remaining = sandboxSellers.filter((seller) => seller._id !== selectedSellerId);
      setSandboxSellers(remaining);
      if (remaining[0]) applySeller(remaining[0]);
      else startNewSeller();
      setNotice({ type: "success", text: "Sandbox seller removed." });
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to remove sandbox seller") });
    } finally {
      setBusyAction("");
    }
  };

  const replaceBuyer = (updatedBuyer) => {
    setSandboxBuyers((current) => {
      const exists = current.some((buyer) => buyer._id === updatedBuyer._id);
      return exists
        ? current.map((buyer) => buyer._id === updatedBuyer._id ? updatedBuyer : buyer)
        : [updatedBuyer, ...current];
    });
  };

  const saveBuyer = async () => {
    if (!selectedSellerId) {
      setNotice({ type: "error", text: "Select a sandbox seller before adding a buyer." });
      return;
    }
    setBusyAction("buyer-save");
    setNotice(null);
    try {
      const response = selectedBuyerId
        ? await axios.put(`${API_BASE_URL}/api/sandbox/buyers/${selectedBuyerId}`, buyerForm, { headers })
        : await axios.post(
          `${API_BASE_URL}/api/sandbox/sellers/${selectedSellerId}/buyers`,
          buyerForm,
          { headers }
        );
      const savedBuyer = response.data.data;
      replaceBuyer(savedBuyer);
      applyBuyer(savedBuyer);
      setNotice({ type: "success", text: response.data.message || "Sandbox buyer saved." });
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to save sandbox buyer") });
    } finally {
      setBusyAction("");
    }
  };

  const deleteBuyer = async () => {
    if (!selectedBuyerId || !window.confirm("Remove this sandbox buyer?")) return;
    setBusyAction("buyer-delete");
    setNotice(null);
    try {
      await axios.delete(`${API_BASE_URL}/api/sandbox/buyers/${selectedBuyerId}`, { headers });
      const remaining = sandboxBuyers.filter((buyer) => buyer._id !== selectedBuyerId);
      setSandboxBuyers(remaining);
      if (remaining[0]) applyBuyer(remaining[0]);
      else startNewBuyer();
      setNotice({ type: "success", text: "Sandbox buyer removed." });
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to remove sandbox buyer") });
    } finally {
      setBusyAction("");
    }
  };

  const selectScenario = (scenario) => {
    setSelectedScenarioId(scenario.id);
    setItemForm(scenario.item);
    setBuyerForm((current) => ({
      ...current,
      buyerRegistrationType: scenario.buyerRegistrationType,
    }));
    setNotice(null);
    setLastExchange(null);
  };

  const runScenario = async (action) => {
    if (!selectedSeller?.isAssigned) {
      setNotice({ type: "error", text: "Assign the sandbox seller and token first." });
      return;
    }
    setBusyAction(action);
    setNotice(null);
    setLastExchange(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/sandbox/run`,
        {
          sellerId: selectedSellerId,
          scenarioId: selectedScenarioId,
          action,
          buyer: buyerForm,
          item: itemForm,
        },
        { headers }
      );
      const data = response.data;
      const nextResults = [
        ...scenarioResults.filter((entry) => entry.scenarioId !== selectedScenarioId),
        { scenarioId: selectedScenarioId, status: data.status, lastResponse: data.fbrResponse },
      ];
      setScenarioResults(nextResults);
      replaceSeller({ ...selectedSeller, scenarioResults: nextResults });
      setLastExchange({ payload: data.requestPayload, response: data.fbrResponse });
      setNotice({
        type: "success",
        text: action === "post" ? `${selectedScenarioId} cleared successfully.` : `${selectedScenarioId} is valid.`,
      });
    } catch (error) {
      const data = error.response?.data;
      if (data?.requestPayload || data?.fbrResponse) {
        setLastExchange({ payload: data.requestPayload, response: data.fbrResponse });
      }
      let nextResults = scenarioResults;
      if (data?.status) {
        nextResults = [
          ...scenarioResults.filter((entry) => entry.scenarioId !== selectedScenarioId),
          { scenarioId: selectedScenarioId, status: data.status, lastResponse: data.fbrResponse },
        ];
        setScenarioResults(nextResults);
      }
      if (data?.status) {
        replaceSeller({ ...selectedSeller, scenarioResults: nextResults });
      }
      setNotice({ type: "error", text: responseMessage(error, "Sandbox request failed") });
    } finally {
      setBusyAction("");
    }
  };

  const resetProgress = async () => {
    if (!selectedSellerId || !window.confirm("Reset all scenario results for this sandbox seller?")) return;
    setBusyAction("reset");
    setNotice(null);
    try {
      await axios.delete(`${API_BASE_URL}/api/sandbox/sellers/${selectedSellerId}/progress`, { headers });
      setScenarioResults([]);
      replaceSeller({ ...selectedSeller, scenarioResults: [] });
      setLastExchange(null);
      setNotice({ type: "success", text: "Scenario progress reset." });
    } catch (error) {
      setNotice({ type: "error", text: responseMessage(error, "Unable to reset progress") });
    } finally {
      setBusyAction("");
    }
  };

  const updateSeller = (field, value) => setSellerForm((current) => ({ ...current, [field]: value }));
  const updateBuyer = (field, value) => setBuyerForm((current) => ({ ...current, [field]: value }));
  const updateItem = (field, value) => setItemForm((current) => ({ ...current, [field]: value }));

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center text-blue-600"><FaSpinner className="mr-3 animate-spin" /> Loading sandbox...</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700"><FaFlask /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">FBR Sandbox</h1>
            <p className="text-sm text-slate-500">Assign a seller and token once, then reuse those seller fields in every selected scenario.</p>
          </div>
        </div>
        {selectedSeller?.isAssigned && (
          <button type="button" onClick={resetProgress} disabled={Boolean(busyAction)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <FaRedo /> Reset Progress
          </button>
        )}
      </div>

      {notice && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
          {notice.text}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Sandbox Sellers</h2>
              <p className="text-xs text-slate-500">Separate from portal sellers</p>
            </div>
            <button type="button" onClick={startNewSeller} className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700" title="Add sandbox seller"><FaPlus /></button>
          </div>
          <div className="space-y-2">
            {!sandboxSellers.length && <div className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">No sandbox sellers yet.</div>}
            {sandboxSellers.map((seller) => (
              <button key={seller._id} type="button" onClick={() => applySeller(seller)} className={`w-full rounded-xl border p-3 text-left transition ${seller._id === selectedSellerId ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-800">{seller.sellerBusinessName}</div>
                    <div className="text-xs text-slate-500">{seller.sellerNTNCNIC}</div>
                  </div>
                  {seller.isAssigned ? <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" title="Seller assigned" /> : <FaLock className="mt-0.5 shrink-0 text-amber-500" title="Assignment required" />}
                </div>
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{seller.scenarioResults?.filter((entry) => entry.status === "Cleared").length || 0} / {scenarios.length} cleared</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">{selectedSellerId ? "Sandbox Seller Details" : "Add Sandbox Seller"}</h2>
              <p className="text-xs text-slate-500">These saved seller fields are inserted automatically into every scenario payload.</p>
            </div>
            {selectedSeller?.isAssigned && <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"><FaCheckCircle /> Assigned</span>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className={labelClass}>Seller NTN/CNIC</span><input className={fieldClass} value={sellerForm.sellerNTNCNIC} onChange={(event) => updateSeller("sellerNTNCNIC", event.target.value)} placeholder="7 or 13 digits" /></label>
            <label><span className={labelClass}>Business Name</span><input className={fieldClass} value={sellerForm.sellerBusinessName} onChange={(event) => updateSeller("sellerBusinessName", event.target.value)} /></label>
            <label><span className={labelClass}>Province</span><select className={fieldClass} value={sellerForm.sellerProvince} onChange={(event) => updateSeller("sellerProvince", event.target.value)}>{provinces.map((province) => <option key={province}>{province}</option>)}</select></label>
            <label><span className={labelClass}>Address</span><input className={fieldClass} value={sellerForm.sellerAddress} onChange={(event) => updateSeller("sellerAddress", event.target.value)} /></label>
            <label className="sm:col-span-2">
              <span className={labelClass}>FBR Sandbox API Token</span>
              <input type="password" className={fieldClass} value={sellerForm.sandboxToken} onChange={(event) => updateSeller("sandboxToken", event.target.value)} placeholder={selectedSeller?.hasSandboxToken ? "Leave blank to keep the saved token" : "Paste seller sandbox token"} autoComplete="new-password" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={assignSeller} disabled={Boolean(busyAction)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">
              {busyAction === "assign" ? <FaSpinner className="animate-spin" /> : selectedSellerId ? <FaSave /> : <FaCheckCircle />}
              {selectedSellerId ? "Update Seller Assignment" : "Assign & Add Seller"}
            </button>
            {selectedSellerId && <button type="button" onClick={deleteSeller} disabled={Boolean(busyAction)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"><FaTrash /> Remove</button>}
          </div>
        </section>
      </div>

      {!selectedSeller?.isAssigned ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <FaLock className="mx-auto mb-3 text-2xl text-amber-500" />
          <h2 className="font-bold text-amber-900">Scenarios are locked</h2>
          <p className="mt-1 text-sm text-amber-700">Add or select an assigned sandbox seller to show SN001–SN028.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">Sandbox Buyers</h2>
                  <p className="text-xs text-slate-500">Saved for {selectedSeller.sellerBusinessName}</p>
                </div>
                <button type="button" onClick={startNewBuyer} className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700" title="Add sandbox buyer"><FaPlus /></button>
              </div>
              <div className="space-y-2">
                {buyerLoading && <div className="flex items-center justify-center rounded-lg bg-slate-50 p-4 text-sm text-slate-500"><FaSpinner className="mr-2 animate-spin" /> Loading buyers...</div>}
                {!buyerLoading && !sandboxBuyers.length && <div className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">No sandbox buyers yet.</div>}
                {!buyerLoading && sandboxBuyers.map((buyer) => (
                  <button key={buyer._id} type="button" onClick={() => applyBuyer(buyer)} className={`w-full rounded-xl border p-3 text-left transition ${buyer._id === selectedBuyerId ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}>
                    <div className="truncate text-sm font-bold text-slate-800">{buyer.buyerBusinessName}</div>
                    <div className="text-xs text-slate-500">{buyer.buyerNTNCNIC}</div>
                    <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{buyer.buyerRegistrationType}</div>
                  </button>
                ))}
              </div>
            </aside>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="font-bold text-slate-900">{selectedBuyerId ? "Sandbox Buyer Details" : "Add Sandbox Buyer"}</h2>
                <p className="text-xs text-slate-500">Save the FBR test buyer once, then select it from the list for any scenario.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label><span className={labelClass}>Buyer NTN/CNIC</span><input className={fieldClass} value={buyerForm.buyerNTNCNIC} onChange={(event) => updateBuyer("buyerNTNCNIC", event.target.value)} placeholder="7 or 13 digits" /></label>
                <label><span className={labelClass}>Business Name</span><input className={fieldClass} value={buyerForm.buyerBusinessName} onChange={(event) => updateBuyer("buyerBusinessName", event.target.value)} /></label>
                <label><span className={labelClass}>Province</span><select className={fieldClass} value={buyerForm.buyerProvince} onChange={(event) => updateBuyer("buyerProvince", event.target.value)}>{provinces.map((province) => <option key={province}>{province}</option>)}</select></label>
                <label><span className={labelClass}>Registration Type</span><select className={fieldClass} value={buyerForm.buyerRegistrationType} onChange={(event) => updateBuyer("buyerRegistrationType", event.target.value)}><option>Registered</option><option>Unregistered</option></select></label>
                <label><span className={labelClass}>Address</span><input className={fieldClass} value={buyerForm.buyerAddress} onChange={(event) => updateBuyer("buyerAddress", event.target.value)} /></label>
                <label><span className={labelClass}>Invoice Reference No</span><input className={fieldClass} value={buyerForm.invoiceRefNo} onChange={(event) => updateBuyer("invoiceRefNo", event.target.value)} placeholder="Optional" /></label>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={saveBuyer} disabled={Boolean(busyAction)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">
                  {busyAction === "buyer-save" ? <FaSpinner className="animate-spin" /> : selectedBuyerId ? <FaSave /> : <FaPlus />}
                  {selectedBuyerId ? "Update Buyer" : "Add Buyer"}
                </button>
                {selectedBuyerId && <button type="button" onClick={deleteBuyer} disabled={Boolean(busyAction)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"><FaTrash /> Remove</button>}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Select Scenario to Clear</h2>
                <p className="text-xs text-slate-500">Selecting a card loads its documented payload defaults.</p>
              </div>
              <div className="text-sm text-slate-600"><strong>{scenarioResults.filter((result) => result.status === "Cleared").length}</strong> / {scenarios.length} cleared</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {scenarios.map((scenario) => {
                const result = resultByScenario[scenario.id];
                const isSelected = scenario.id === selectedScenarioId;
                return (
                  <button key={scenario.id} type="button" onClick={() => selectScenario(scenario)} className={`rounded-xl border p-4 text-left transition ${isSelected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-300"}`}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-bold text-blue-700">{scenario.id}</span>
                      {result?.status === "Cleared" ? <FaCheckCircle className="text-emerald-500" title="Cleared" /> : result?.status === "Failed" ? <FaTimesCircle className="text-red-500" title="Failed" /> : result?.status === "Valid" ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">VALID</span> : <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />}
                    </div>
                    <div className="text-sm font-semibold text-slate-800">{scenario.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500">{scenario.description}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedScenario && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="font-bold text-slate-900">Selected: {selectedScenario.id} — {selectedScenario.title}</h2>
                <p className="text-xs text-slate-500">Review the item before validating or clearing this scenario.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {itemFields.map(([field, label, type]) => (
                  <label key={field}>
                    <span className={labelClass}>{label}</span>
                    <input
                      type={type}
                      step={type === "number" ? "any" : undefined}
                      list={
                        field === "productDescription" &&
                        String(itemForm.saleType || "").trim().toLowerCase() === "petroleum products"
                          ? "petroleum-product-description-options"
                          : undefined
                      }
                      className={fieldClass}
                      value={itemForm[field] ?? ""}
                      onChange={(event) => updateItem(field, event.target.value)}
                    />
                  </label>
                ))}
                {String(itemForm.saleType || "").trim().toLowerCase() === "petroleum products" && (
                  <datalist id="petroleum-product-description-options">
                    {petroleumProductDescriptions.map((description) => (
                      <option key={description} value={description} />
                    ))}
                  </datalist>
                )}
                <label className="sm:col-span-2 lg:col-span-4"><span className={labelClass}>Sale Type</span><input className={fieldClass} value={itemForm.saleType || ""} onChange={(event) => updateItem("saleType", event.target.value)} /></label>
                {String(itemForm.saleType || "").trim().toLowerCase() === "petroleum products" && (
                  <label className="sm:col-span-2 lg:col-span-4">
                    <span className={labelClass}>Petroleum Levy On</span>
                    <input
                      list="petroleum-levy-options"
                      className={fieldClass}
                      value={itemForm.petroleumLevyOn || ""}
                      onChange={(event) => updateItem("petroleumLevyOn", event.target.value)}
                      placeholder="Select or type a petroleum levy option"
                    />
                    <datalist id="petroleum-levy-options">
                      <option value="no levy" />
                      <option value="direct sale" />
                      <option value="retail sale" />
                      <option value="differential" />
                    </datalist>
                  </label>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => runScenario("validate")} disabled={Boolean(busyAction)} className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-white px-5 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
                  {busyAction === "validate" ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} Validate Selected
                </button>
                <button type="button" onClick={() => runScenario("post")} disabled={Boolean(busyAction)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
                  {busyAction === "post" ? <FaSpinner className="animate-spin" /> : <FaFlask />} Publish Selected Scenario
                </button>
              </div>
            </section>
          )}

          {lastExchange && (
            <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-slate-100 shadow-sm">
              <h2 className="mb-3 font-bold">Last FBR Exchange</h2>
              <div className="grid gap-4 xl:grid-cols-2">
                <div><div className="mb-2 text-xs font-semibold uppercase text-slate-400">Request Payload</div><pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs">{JSON.stringify(lastExchange.payload, null, 2)}</pre></div>
                <div><div className="mb-2 text-xs font-semibold uppercase text-slate-400">FBR Response</div><pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs">{JSON.stringify(lastExchange.response, null, 2)}</pre></div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default SandboxPanel;
