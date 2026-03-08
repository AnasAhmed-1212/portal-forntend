import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext.jsx";

/* ==============================
   TABLE COLUMNS FOR BUYER
================================ */
export const buyerColumns = [
  {
    name: "S.NO",
    selector: (row) => row.sno,
    width: "80px",
  },
  {
    name: "Buyer Name",
    selector: (row) => row.buyerName,
  },
  {
    name: "Business Name", // ADD THIS SECTION
    selector: (row) => row.buyerBusinessName,
    sortable: true,
  },
  {
    name: "NTN",
    selector: (row) => row.ntnNumber,
  },
  {
    name: "Province",
    selector: (row) => row.province,
  },
  {
    name: "Registration Type",
    selector: (row) => row.registrationType,
  },
  {
    name: "Action",
    selector: (row) => row.action,
    center: true,
  },
];


/* ==============================
   BUYER ACTION BUTTONS
================================ */
export const BuyerButtons = ({ _id, onBuyerDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === "admin" ? "/admin-dashboard/buyer" : "/seller-dashboard/buyer";

  /* DELETE BUYER */
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this buyer?"
    );

    if (confirmDelete) {
      try {
        const response = await axios.delete(
          `https://portal-backend-dun.vercel.app/api/buyer/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
            navigate(`${basePath}/add/`)
          onBuyerDelete(id); // update UI without reload
        }
      } catch (error) {
        navigate(`${basePath}/add/`)
        alert(error.response?.data?.error || "Delete failed");
      }
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {/* EDIT */}
      <button
        onClick={() => navigate(`${basePath}/${_id}`)}
        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
      >
        Edit
      </button>

      {/* DELETE */}
      <button
        onClick={() => handleDelete(_id)}
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
      >
        Delete
      </button>
    </div>
  );
};
