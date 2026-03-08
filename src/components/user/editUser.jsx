import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaUser, FaEnvelope, FaLock, FaUserShield, FaBuilding } from "react-icons/fa";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [sellers, setSellers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Employee",
    sellerId: "",
    isActive: true,
  });

  // Fetch user data and sellers
  useEffect(() => {
    fetchSellers();
    fetchUser();
  }, [id]);

  const fetchSellers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("https://portal-backend-dun.vercel.app/api/user/sellers-for-assignment", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setSellers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Get all users and find the one we need
      const response = await axios.get("https://portal-backend-dun.vercel.app/api/user/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        const user = response.data.data.find(u => u._id === id);
        if (user) {
          setFormData({
            name: user.name || "",
            email: user.email || "",
            password: "", // Don't show password
            role: user.role || "Employee",
            sellerId: user.sellerId?._id || "",
            isActive: user.isActive ?? true,
          });
        } else {
          alert("User not found");
          navigate("/admin-dashboard/users");
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      alert("Error fetching user");
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;
    setFormData({
      ...formData,
      [name]: nextValue,
      ...(name === "role" && nextValue === "admin" ? { sellerId: "" } : {}),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.role === "Employee" && !formData.sellerId) {
      alert("Please assign a seller for employee user.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        sellerId: formData.role === "admin" ? null : formData.sellerId || null,
        isActive: formData.isActive,
      };

      // Only include password if provided
      if (formData.password) {
        userData.password = formData.password;
      }

      const response = await axios.put(`https://portal-backend-dun.vercel.app/api/user/${id}`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        alert("User updated successfully");
        navigate("/admin-dashboard/users");
      }
    } catch (error) {
      alert(error.response?.data?.error || "Error updating user");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-slate-500">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin-dashboard/users")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <FaArrowLeft />
          <span>Back to Users</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Edit User</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update user information and seller assignment
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUser className="text-slate-400" />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter full name"
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="text-slate-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter email address"
            />
          </div>
        </div>

        {/* Password - Optional for update */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password <span className="text-slate-400">(Leave empty to keep current)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="text-slate-400" />
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
        </div>

        {/* Role */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUserShield className="text-slate-400" />
            </div>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
            >
              <option value="Employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Assign Seller */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Assign Seller <span className="text-slate-400">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaBuilding className="text-slate-400" />
            </div>
            <select
              name="sellerId"
              value={formData.sellerId}
              onChange={handleChange}
              disabled={formData.role === "admin"}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
            >
              <option value="">-- Select Seller (Optional) --</option>
              {sellers.map((seller) => (
                <option key={seller._id} value={seller._id}>
                  {seller.sellerBusinessName} ({seller.sellerNTNCNIC})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Leave empty for admin users. Employees must be assigned to a seller.
          </p>
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
            {loading ? "Updating..." : "Update User"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin-dashboard/users")}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 rounded-xl font-bold text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;

