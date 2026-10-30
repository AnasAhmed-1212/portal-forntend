import { API_BASE_URL } from "../../lib/api";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EntityListPage from "../shared/EntityListPage.jsx";

const SellerList = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredSellers, setFilteredSellers] = useState([]);

  // Fetch sellers
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/seller/`, {
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
        `${API_BASE_URL}/api/seller/${id}/toggle-status`,
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
        `${API_BASE_URL}/api/seller/${id}`,
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
        <Badge variant={row.isActive ? "secondary" : "destructive"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      name: "Created",
      selector: (row) => row.createdAt,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-1">
          <Button asChild variant="ghost" size="icon-sm"><Link to={`/admin-dashboard/seller/${row._id}`} title="Edit seller"><FaEdit /></Link></Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => handleToggleStatus(row._id)}
            title={row.isActive ? "Deactivate seller" : "Activate seller"}
          >
            {row.isActive ? <FaToggleOff /> : <FaToggleOn />}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            onClick={() => handleDelete(row._id)}
            title="Delete seller"
          >
            <FaTrash />
          </Button>
        </div>
      ),
      width: "150px",
    },
  ];

  return (
    <EntityListPage
      eyebrow="Seller setup"
      title="Seller management"
      description="Manage seller profiles, access status, and FBR token assignments."
      addLabel="Add seller"
      addPath="/admin-dashboard/seller/add"
      searchPlaceholder="Search sellers..."
      onSearch={filterSellers}
    >
      {loading ? (
        <div className="space-y-2 p-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12" />)}</div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredSellers}
          pagination
          highlightOnHover
          responsive
          noDataComponent={<div className="py-8 text-muted-foreground">No sellers found.</div>}
        />
      )}
    </EntityListPage>
  );
};

export default SellerList;

