import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaTimes } from "react-icons/fa";
import { useAuth } from "../../context/authContext.jsx";

const BuyerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const buyerListPath = user?.role === "admin" ? "/admin-dashboard/buyer/add/" : "/seller-dashboard/buyer/add/";

  const [buyer, setBuyer] = useState({
    buyerName: "",
    ntnNumber: "",
    address: "",
    province: "",
    registrationType: "",
  });

  const [loading, setLoading] = useState(false);

  /* =========================
     FETCH BUYER BY ID
  ========================== */
  useEffect(() => {
    const fetchBuyer = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://portal-backend-dun.vercel.app/api/buyer/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setBuyer(response.data.data);
        }
      } catch (error) {
        alert(error.response?.data?.error || "Error fetching buyer");
      } finally {
        setLoading(false);
      }
    };

    fetchBuyer();
  }, [id]);

  /* =========================
     HANDLE INPUT CHANGE
  ========================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBuyer({ ...buyer, [name]: value });
  };

  /* =========================
     UPDATE BUYER
  ========================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `https://portal-backend-dun.vercel.app/api/buyer/${id}`,
        buyer,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        navigate(buyerListPath);
      }
    } catch (error) {
      alert(error.response?.data?.error || "Update failed");
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
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 lg:p-8">

        <div className="mb-6">
          <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 text-center">Edit Buyer</h3>
          <p className="text-slate-600 text-center">Update buyer information</p>
          <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mt-3"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Buyer Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Buyer Name
            </label>
            <input
              name="buyerName"
              value={buyer.buyerName}
              onChange={handleChange}
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 transition duration-200"
              required
            />
          </div>

          {/* NTN */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              NTN Number
            </label>
            <input
              name="ntnNumber"
              value={buyer.ntnNumber}
              onChange={handleChange}
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 transition duration-200"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={buyer.address}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 transition duration-200"
              required
            />
          </div>

          {/* Province */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Province
            </label>
            <select
              name="province"
              value={buyer.province}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 transition duration-200 cursor-pointer"
            >
              <option value="">Select Province</option>
              <option value="Sindh">Sindh</option>
              <option value="Punjab">Punjab</option>
              <option value="KPK">KPK</option>
              <option value="Balochistan">Balochistan</option>
              <option value="Islamabad">Islamabad</option>
            </select>
          </div>

          {/* Registration Type */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Registration Type
            </label>
            <select
              name="registrationType"
              value={buyer.registrationType}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 transition duration-200 cursor-pointer"
            >
              <option value="">Select Type</option>
              <option value="Registered">Registered</option>
              <option value="Unregistered">Unregistered</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 transform transition duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <FaSave /> Update Buyer
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-slate-200 text-slate-800 py-3 rounded-lg font-bold text-lg hover:bg-slate-300 hover:scale-105 transform transition duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <FaTimes /> Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BuyerEdit;
