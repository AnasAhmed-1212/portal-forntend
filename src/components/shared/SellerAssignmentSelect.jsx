import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../lib/api";

export default function SellerAssignmentSelect({ value, onChange }) {
  const [sellers, setSellers] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE_URL}/api/seller/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then(({ data }) => {
      if (active) setSellers(data.data || []);
    }).catch(() => { if (active) setError("Unable to load sellers"); });
    return () => { active = false; };
  }, []);
  return <div>
    <label className="block font-medium mb-1" htmlFor="assigned-seller">Seller</label>
    <select id="assigned-seller" required value={value || ""} onChange={(event) => onChange(event.target.value)} className="w-full border rounded-lg p-3">
      <option value="">Select seller</option>
      {sellers.filter((seller) => seller.isActive).map((seller) => <option key={seller._id} value={seller._id}>{seller.sellerBusinessName}</option>)}
    </select>
    {error && <p role="alert">{error}</p>}
  </div>;
}
