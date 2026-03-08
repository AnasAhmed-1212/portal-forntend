import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

const SellerList = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredSellers, setFilteredSellers] = useState([]);

  // Fetch sellers
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await axios.get("https://portal-backend-dun.vercel.app/api/seller/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          const data = response.data.data.map((seller, index) => ({
            _id: seller._id,
            sno: index + 1,
            sellerBusinessName: seller.sellerBusinessName,
            sellerNTNCNIC: seller.sellerNTNCNIC,
            sellerProvince: seller.sellerProvince,
            sellerEmail: seller.sellerEmail || "N/A",
            isActive: seller.isActive,
            createdAt: new Date(seller.createdAt).toLocaleDateString(),
          }));
          setSellers(data);
          setFilteredSellers(data);
        }
      } catch (error) {
        console.error(error);
        alert("Error fetching sellers");
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, []);

  // Toggle seller status
  const handleToggleStatus = async (id) => {
    try {
      const response = await axios.put(
        `https://portal-backend-dun.vercel.app/api/seller/${id}/toggle-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        // Update local state
        const updatedSellers = sellers.map((seller) =>
          seller._id === id
            ? { ...seller, isActive: response.data.data.isActive }
            : seller
        );
        setSellers(updatedSellers);
        setFilteredSellers(updatedSellers);
        alert(response.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.error || "Error toggling status");
    }
  };

  // Delete seller
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this seller?")) return;
    
    try {
      const response = await axios.delete(
        `https://portal-backend-dun.vercel.app/api/seller/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        const updatedSellers = sellers.filter((seller) => seller._id !== id);
        setSellers(updatedSellers);
        setFilteredSellers(updatedSellers);
        alert(response.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.error || "Error deleting seller");
    }
  };

  // Search filter
  const filterSellers = (e) => {
    const value = e.target.value.toLowerCase();
    const filtered = sellers.filter(
      (seller) =>
        seller.sellerBusinessName.toLowerCase().includes(value) ||
        seller.sellerNTNCNIC.toLowerCase().includes(value) ||
        seller.sellerProvince.toLowerCase().includes(value)
    );
    setFilteredSellers(filtered);
  };

  // Table columns
  const columns = [
    {
      name: "S.No",
      selector: (row) => row.sno,
      width: "70px",
    },
    {
      name: "Business Name",
      selector: (row) => row.sellerBusinessName,
      sortable: true,
    },
    {
      name: "NTN/CNIC",
      selector: (row) => row.sellerNTNCNIC,
    },
    {
      name: "Province",
      selector: (row) => row.sellerProvince,
    },
    {
      name: "Email",
      selector: (row) => row.sellerEmail,
    },
    {
      name: "Status",
      selector: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      name: "Created",
      selector: (row) => row.createdAt,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <Link
            to={`/admin-dashboard/seller/${row._id}`}
            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
          >
            <FaEdit />
          </Link>
          <button
            onClick={() => handleToggleStatus(row._id)}
            className={`p-2 rounded ${
              row.isActive
                ? "bg-red-100 text-red-600 hover:bg-red-200"
                : "bg-green-100 text-green-600 hover:bg-green-200"
            }`}
          >
            {row.isActive ? <FaToggleOff /> : <FaToggleOn />}
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
          >
            <FaTrash />
          </button>
        </div>
      ),
      width: "150px",
    },
  ];

  return (
    <div className="p-4 lg:p-6 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl lg:text-3xl font-bold text-gray-800">
            Seller Management
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Manage sellers and assign FBR tokens
          </p>
        </div>

        <Link
          to="/admin-dashboard/seller/add"
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm"
        >
          <FaPlus className="mr-2" />
          Add New Seller
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <FaSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search sellers..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              onChange={filterSellers}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-4 rounded-xl shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredSellers}
          pagination
          progressPending={loading}
          highlightOnHover
          responsive
        />
      </div>
    </div>
  );
};

export default SellerList;

