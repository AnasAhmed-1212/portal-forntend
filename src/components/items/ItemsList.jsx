import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import axios from "axios";
import { itemsColumn, ItemButtons } from "../../utils/itemHelper.jsx";
import { customTableStyles } from "../../utils/tableStyles";
import { useAuth } from "../../context/authContext.jsx";
import EntityListPage from "../shared/EntityListPage.jsx";
import { Skeleton } from "@/components/ui/skeleton";


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

      
    
  if (loading) {
    return <div className="page-shell"><div className="page-container space-y-4"><Skeleton className="h-20" /><Skeleton className="h-14" /><Skeleton className="h-96" /></div></div>;
  }

  return (
    <EntityListPage
      eyebrow="Item setup"
      title="Manage items"
      description="Maintain products, HS codes, tax rates, and units of measurement."
      addLabel="Add item"
      addPath={addItemPath}
      searchPlaceholder="Search items..."
      onSearch={filterItems}
    >
      <DataTable
        columns={itemsColumn}
        data={filteredItems}
        pagination
        highlightOnHover
        customStyles={customTableStyles}
        responsive
      />
    </EntityListPage>
  )
}

export default ItemsList;
