import { API_BASE_URL } from "../../lib/api";



import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import axios from "axios";
import { buyerColumns, BuyerButtons } from "../../utils/BuyerHelper.jsx";
import { customTableStyles } from "../../utils/tableStyles";
import { useAuth } from "../../context/authContext.jsx";
import EntityListPage from "../shared/EntityListPage.jsx";
import { Skeleton } from "@/components/ui/skeleton";

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
          `${API_BASE_URL}/api/buyer/`,
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

  if (loading) {
    return <div className="page-shell"><div className="page-container space-y-4"><Skeleton className="h-20" /><Skeleton className="h-14" /><Skeleton className="h-96" /></div></div>;
  }

  return (
    <EntityListPage
      eyebrow="Buyer setup"
      title="Manage buyers"
      description="Add, edit, and manage buyer information used on invoices."
      addLabel="Add buyer"
      addPath={addBuyerPath}
      searchPlaceholder="Search buyers..."
      onSearch={filterBuyers}
    >
      <DataTable
        columns={buyerColumns}
        data={filteredBuyers}
        pagination
        highlightOnHover
        customStyles={customTableStyles}
        responsive
      />
    </EntityListPage>
  );
};

export default BuyerList;
