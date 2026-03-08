import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope, FaKey } from "react-icons/fa";

const EditSeller = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    sellerBusinessName: "",
    sellerNTNCNIC: "",
    sellerProvince: "",
    sellerAddress: "",
    sellerEmail: "",
    sellerPhone: "",
    fbrToken: "",
    isActive: true,
  });

  // Fetch seller data
  useEffect(() => {
    fetchSeller();
  }, [id]);

  const fetchSeller = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`https://portal-backend-dun.vercel.app/api/seller/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const seller = response.data.data;
        setFormData({
          sellerBusinessName: seller.sellerBusinessName || "",
          sellerNTNCNIC: seller.sellerNTNCNIC || "",
          sellerProvince: seller.sellerProvince || "",
          sellerAddress: seller.sellerAddress || "",
          sellerEmail: seller.sellerEmail || "",
          sellerPhone: seller.sellerPhone || "",
          fbrToken: seller.fbrToken || "",
          isActive: seller.isActive ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching seller:", error);
      alert("Error fetching seller");
      navigate("/admin-dashboard/seller");
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`https://portal-backend-dun.vercel.app/api/seller/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        alert("Seller updated successfully");
        navigate("/admin-dashboard/seller");
      }
    } catch (error) {
      alert(error.response?.data?.error || "Error updating seller");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-slate-500">Loading seller data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin-dashboard/seller")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <FaArrowLeft />
          <span>Back to Sellers</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Edit Seller</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update seller/business account details
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {/* Business Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Business Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaBuilding className="text-slate-400" />
            </div>
            <input
              type="text"
              name="sellerBusinessName"
              value={formData.sellerBusinessName}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter business name"
            />
          </div>
        </div>

        {/* NTN/CNIC */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            NTN/CNIC <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="sellerNTNCNIC"
            value={formData.sellerNTNCNIC}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
            placeholder="Enter NTN or CNIC"
          />
        </div>

        {/* Province */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Province <span className="text-red-500">*</span>
          </label>
          <select
            name="sellerProvince"
            value={formData.sellerProvince}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
          >
            <option value="">Select Province</option>
            <option value="Punjab">Punjab</option>
            <option value="Sindh">Sindh</option>
            <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
            <option value="Balochistan">Balochistan</option>
            <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
            <option value="Azad Jammu Kashmir">Azad Jammu Kashmir</option>
          </select>
        </div>

        {/* Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaMapMarkerAlt className="text-slate-400" />
            </div>
            <input
              type="text"
              name="sellerAddress"
              value={formData.sellerAddress}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter address"
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="text-slate-400" />
            </div>
            <input
              type="email"
              name="sellerEmail"
              value={formData.sellerEmail}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter email (optional)"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Phone
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaPhone className="text-slate-400" />
            </div>
            <input
              type="text"
              name="sellerPhone"
              value={formData.sellerPhone}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter phone (optional)"
            />
          </div>
        </div>

        {/* FBR Token */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            FBR API Token <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaKey className="text-slate-400" />
            </div>
            <input
              type="text"
              name="fbrToken"
              value={formData.fbrToken}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter FBR API token"
            />
          </div>
        </div>

        {/* Active Status */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Active</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Seller"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin-dashboard/seller")}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 rounded-xl font-bold text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSeller;

