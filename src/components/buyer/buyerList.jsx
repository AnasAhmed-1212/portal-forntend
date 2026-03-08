


import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";
import { buyerColumns, BuyerButtons } from "../../utils/BuyerHelper.jsx";
import { customTableStyles } from "../../utils/tableStyles";
import { FaPlus, FaSearch, FaFileExport } from "react-icons/fa";
import { useAuth } from "../../context/authContext.jsx";

const BuyerList = () => {
  const { user } = useAuth();
  const addBuyerPath = user?.role === "admin" ? "/admin-dashboard/buyer/adding" : "/seller-dashboard/buyer/adding";
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredBuyers, setFilteredBuyers] = useState([]);

  /* DELETE HANDLER */
  const onBuyerDelete = (id) => {
    const updatedData = buyers.filter((buyer) => buyer._id !== id);
    setBuyers(updatedData);
    setFilteredBuyers(updatedData);
  };

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const response = await axios.get(
          "https://portal-backend-dun.vercel.app/api/buyer/",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          let sno = 1;

          const data = response.data.data.map((buyer) => ({
            _id: buyer._id,
            sno: sno++,
            buyerName: buyer.buyerName,
            buyerBusinessName: buyer.buyerBusinessName,
            ntnNumber: buyer.ntnNumber,
            province: buyer.province,
            registrationType: buyer.registrationType,
            action: (
              <BuyerButtons
                _id={buyer._id}
                onBuyerDelete={onBuyerDelete}
              />
            ),
          }));

          setBuyers(data);
          setFilteredBuyers(data);
        }
      } catch (error) {
        console.error(error);
        alert("Error fetching buyers");
      } finally {
        setLoading(false);
      }
    };

    fetchBuyers();
  }, []);

  /* SEARCH FILTER */
  const filterBuyers = (e) => {
    const value = e.target.value.toLowerCase();

    const filtered = buyers.filter((buyer) =>
      buyer.buyerName.toLowerCase().includes(value) ||
      buyer.buyerBusinessName.toLowerCase().includes(value) ||
      buyer.ntnNumber.toLowerCase().includes(value) ||
      buyer.province.toLowerCase().includes(value) ||
      buyer.registrationType.toLowerCase().includes(value)
    );

    setFilteredBuyers(filtered);
  };

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="p-4 lg:p-6 min-h-screen bg-slate-50">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Manage Buyers
              </h3>
              <p className="text-sm text-slate-500 mt-1">Add, edit, and manage your buyer information.</p>
            </div>

            <Link
              to={addBuyerPath}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm"
            >
              <FaPlus className="mr-2" />
              Add New Buyer
            </Link>
          </div>

          {/* Search and Actions */}
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FaSearch className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search buyers..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  onChange={filterBuyers}
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all w-full md:w-auto justify-center">
                  <FaFileExport className="w-4 h-4" />
                  Export
                </button>
                <Link to={addBuyerPath} className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold w-full md:w-auto">
                  <FaPlus className="w-4 h-4" />
                  Add
                </Link>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white p-4 rounded-xl shadow-sm overflow-hidden">
            <DataTable
              columns={buyerColumns}
              data={filteredBuyers}
              pagination
              highlightOnHover
              customStyles={customTableStyles}
              responsive
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BuyerList;
