import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { FaSave, FaTimes } from "react-icons/fa";
import { useAuth } from "../../context/authContext";

const AddBuyer = () => {
  const { user } = useAuth();
  const [buyer, setBuyer] = useState({
    buyerName: "",
    buyerBusinessName: "",
    ntnNumber: "",
    address: "",
    province: "",
    registrationType: "",
  });

  const [provinceOptions, setProvinceOptions] = useState([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);

  const navigate = useNavigate();
  
  // Determine navigation path based on user role
  const isAdmin = user?.role === "admin";
  const buyerListPath = isAdmin ? "/admin-dashboard/buyer/add/" : "/seller-dashboard/buyer/add/";
  
  // FBR token must come only from assigned seller
  const FBR_TOKEN = user?.sellerId?.fbrToken || "";
  
  useEffect(() => {
    const fetchProvinces = async () => {
      if (!FBR_TOKEN) {
        setProvinceOptions([]);
        return;
      }
      try {
        setIsLoadingProvinces(true);
        const response = await axios.get("https://gw.fbr.gov.pk/pdi/v1/provinces", {
          headers: { Authorization: `Bearer ${FBR_TOKEN}` },
        });

        // FIXED: Added more robust data checking for FBR API response
        const apiData = response.data?.data || response.data || [];
        const formatted = Array.isArray(apiData) 
          ? apiData.map((p) => ({
              value: p.stateProvinceDesc,
              label: p.stateProvinceDesc,
            }))
          : [];
        setProvinceOptions(formatted);
      } catch (error) {
        console.error("Error fetching provinces:", error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, [FBR_TOKEN]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBuyer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://portal-backend-dun.vercel.app/api/buyer/",
        buyer,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // FIXED: Navigate to list or success page, or reset form 
      if (response.data.success || response.status === 201 || response.status === 200) {
        alert("Buyer added Successfully");
        navigate(buyerListPath); 
      }
    } catch (error) {
      alert(error.response?.data?.error || "Something went wrong while saving.");
    }
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      padding: "2px",
      borderRadius: "8px",
      border: state.isFocused ? "2px solid #3b82f6" : "2px solid #cbd5e1",
      backgroundColor: "#f8fafc",
      boxShadow: "none",
      "&:hover": { border: "#3b82f6" },
    }),
  };

  return (
    <div className="p-4 lg:p-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 lg:p-8">
        
        <div className="mb-6 text-center">
          <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
            Add Buyer
          </h3>
          <p className="text-slate-600">Create a new buyer profile</p>
          <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mt-3"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Buyer Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Buyer Name</label>
            <input
              name="buyerName"
              type="text"
              value={buyer.buyerName}
              onChange={handleChange}
              placeholder="Enter buyer name"
              required
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
            />
          </div>

          {/* FIXED: changed name="buyerName" to name="buyerBusinessName" */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Buyer Business Name</label>
            <input
              name="buyerBusinessName"
              type="text"
              value={buyer.buyerBusinessName}
              onChange={handleChange}
              placeholder="Enter buyer business name"
              required
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">NTN Number</label>
            <input
              name="ntnNumber"
              type="text"
              value={buyer.ntnNumber}
              onChange={handleChange}
              placeholder="e.g. 1234567-8"
              required
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Address</label>
            <textarea
              name="address"
              rows="2"
              value={buyer.address}
              onChange={handleChange}
              placeholder="Enter full address"
              required
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Province</label>
            <Select
              options={provinceOptions}
              isLoading={isLoadingProvinces}
              placeholder="Search or select province..."
              styles={customSelectStyles}
              // FIXED: logic ensures state update works correctly with react-select
              onChange={(opt) => setBuyer({ ...buyer, province: opt ? opt.value : "" })}
              value={provinceOptions.find((o) => o.value === buyer.province) || null}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Registration Type</label>
            <select
              name="registrationType"
              value={buyer.registrationType}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 transition duration-200 cursor-pointer"
            >
              <option value="">Select Type</option>
              <option value="Registered">Registered</option>
              <option value="Unregistered">Unregistered</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold text-lg hover:shadow-lg hover:scale-[1.02] transform transition duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <FaSave /> Add Buyer
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-slate-200 text-slate-800 py-3 rounded-lg font-bold text-lg hover:bg-slate-300 transition duration-200 flex items-center justify-center gap-2"
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBuyer;
