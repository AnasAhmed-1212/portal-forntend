import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";
import { itemsColumn, ItemButtons } from "../../utils/itemHelper.jsx";
import { customTableStyles } from "../../utils/tableStyles";
import { FaPlus, FaSearch, FaFileExport } from "react-icons/fa";
import { useAuth } from "../../context/authContext.jsx";


const ItemsList = () => {
  const { user } = useAuth();
  const addItemPath = user?.role === "admin" ? "/admin-dashboard/items/add" : "/seller-dashboard/items/add";
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);



    /* DELETE HANDLER */
  const onItemDelete = (id) => {
    const updatedData = items.filter((item) => item._id !== id);
    setItems(updatedData);
    setFilteredItems(updatedData);
  };

    useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(
          "https://portal-backend-dun.vercel.app/api/items/add",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          let sno = 1;

          const data = response.data.data.map((item) => ({
            _id: item._id,
            sno: sno++,
            itemName: item.itemName || "N/A",
            sellingPrice: item.sellingPrice|| "N/A",
            unitOfMeasurement: item.unitOfMeasurement|| "N/A",
            hsCode: item.hsCode|| "N/A",
            itemSaleType: item.itemSaleType|| "N/A",
            taxRate: item.taxRate|| "N/A",
            sroSchedule: item.sroSchedule|| "N/A",
            sroItem: item.sroItem|| "N/A",
            action: (
              <ItemButtons
                _id={item._id}
                onItemsDelete={onItemDelete}
              />
            ),
          }));

          setItems(data);
          setFilteredItems(data);
        }
      } catch (error) {
        console.error(error);
        alert("Error fetching items");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

    /* SEARCH FILTER */
const filterItems = (e) => {
    const value = e.target.value.toLowerCase();

    const filtered = items.filter((item) =>
      item.itemName.toLowerCase().includes(value) ||
      String(item.sellingPrice).toLowerCase().includes(value) ||
      item.hsCode.toLowerCase().includes(value) ||
      item.unitOfMeasurement.toLowerCase().includes(value) ||
      item.itemSaleType.toLowerCase().includes(value) ||
      String(item.taxRate).toLowerCase().includes(value) ||   
      item.sroSchedule.toLowerCase().includes(value) ||
      item.sroItem.toLowerCase().includes(value)
    );

    setFilteredItems(filtered);
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
                Manage Items
              </h3>
              <p className="text-sm text-slate-500 mt-1">Add, edit, and manage your product items.</p>
            </div>

            <Link
              to={addItemPath}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm"
            >
              <FaPlus className="mr-2" />
              Add New Item
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
                  placeholder="Search items..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  onChange={filterItems}
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all w-full md:w-auto justify-center">
                  <FaFileExport className="w-4 h-4" />
                  Export
                </button>
                <Link to={addItemPath} className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold w-full md:w-auto">
                  <FaPlus className="w-4 h-4" />
                  Add
                </Link>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white p-4 rounded-xl shadow-sm overflow-hidden">
            <DataTable
              columns={itemsColumn}
              data={filteredItems}
              pagination
              highlightOnHover
              customStyles={customTableStyles}
              responsive
            />
          </div>
        </div>
      )}
    </>
  )
}

export default ItemsList;
