import axios from "axios";

export const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://portal-backend-dun.vercel.app").replace(/\/$/, "");
export const getFbrReference = (path, sellerId) => {
  const url = new URL(path, "https://reference.invalid/");
  const operation = url.pathname.split("/").pop();
  const params = Object.fromEntries(url.searchParams);
  if (sellerId) params.sellerId = sellerId;
  return axios.get(`${API_BASE_URL}/api/fbr/reference/${operation}`, {
    params,
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
};
