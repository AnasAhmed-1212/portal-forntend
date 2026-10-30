import { API_BASE_URL } from "../lib/api";
// itemHelper.jsx
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext.jsx";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ==============================
   TABLE COLUMNS FOR ITEMS
================================ */
export const itemsColumn = [
  { name: "S.NO", selector: (row) => row.sno, width: "80px" },
  { name: "Item Name", selector: (row) => row.itemName },
  { name: "Selling Price", selector: (row) => row.sellingPrice },
  { name: "HS Code", selector: (row) => row.hsCode },
  { name: "Unit of Measurement", selector: (row) => row.unitOfMeasurement },
  { name: "Item Sale Type", selector: (row) => row.itemSaleType },
  { name: "Tax Rate", selector: (row) => row.taxRate, center: true },
  { name: "SRO Schedule", selector: (row) => row.sroSchedule, center: true },
  { name: "SRO Item", selector: (row) => row.sroItem, center: true },
  { name: "Action", selector: (row) => row.action, center: true },
];

/* ==============================
   ITEMS ACTION BUTTONS
================================ */
export const ItemButtons = ({ _id, onItemsDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === "admin" ? "/admin-dashboard/items" : "/seller-dashboard/items";

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this item?");

    if (confirmDelete) {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/items/item/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) { 
          onItemsDelete(id); // update UI without reload
          navigate(basePath); // navigate to refresh list 
        }
      } catch (error) {
        alert(error.response?.data?.error || "Delete failed");
      }
    }
  };

  return (
    <div className="flex justify-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => navigate(`${basePath}/${_id}`)}
        title="Edit item"
      >
        <Pencil /> Edit
      </Button>

      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => handleDelete(_id) }
        title="Delete item"
      >
        <Trash2 /> Delete
      </Button>
    </div>
  );
};
