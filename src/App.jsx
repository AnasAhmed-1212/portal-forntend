import {BrowserRouter, Routes, Route , Navigate} from 'react-router-dom';
import { useAuth } from './context/authContext.jsx';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import SellerDashboard from './pages/SellerDashboard.jsx';
import PrivateRoute from './utils/PrivateRoute.jsx';
import RoleBaseRoute from './utils/RoleBaseRoute.jsx';
import AdminSummary from './components/dashboard/AdminSummary.jsx';
import SellerSummary from './components/dashboard/SellerSummary.jsx';
import ListOfBuyer from './components/buyer/buyerList.jsx';
import AddBuyer from './components/buyer/addBuyer.jsx';
import BuyerEdit from './components/buyer/buyerEdit.jsx';
import ItemsList from './components/items/ItemsList.jsx';
import AddItems from './components/items/addItems.jsx';
import EditItems from './components/items/EditItems.jsx';
import InvoiceList from './components/invoice/list.jsx';
import AddInvoice from './components/invoice/add.jsx';
import InvoicePdf from './components/invoice/invoicePdf.jsx';
import UserList from './components/user/userList.jsx';
import AddUser from './components/user/addUser.jsx';
import EditUser from './components/user/editUser.jsx';
import SellerList from './components/seller/sellerList.jsx';
import AddSeller from './components/seller/addSeller.jsx';
import EditSeller from './components/seller/editSeller.jsx';
import SandboxPanel from './components/sandbox/SandboxPanel.jsx';
import { LoaderCircle } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';


function App() {
  const { loading, user } = useAuth();
  const homeRoute = user?.role === "admin" ? "/admin-dashboard" : "/seller-dashboard";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border bg-card shadow-sm">
            <LoaderCircle className="size-5 animate-spin text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
     <BrowserRouter>
      <Routes>
      <Route path="/" element={<Navigate to={user ? homeRoute : "/login"} />}></Route>
      <Route path="/login" element={<Login/>}></Route>
      <Route path="/unauthorized" element={<Navigate to={user ? homeRoute : "/login"} />}></Route>
      <Route path="/admin-dashboard" element={
        <PrivateRoute>
          <RoleBaseRoute requiredRole={["admin"]}>
            <AdminDashboard/>
          </RoleBaseRoute>
        </PrivateRoute>
        
        
        }>

          <Route index element={<AdminSummary/>}></Route>

          <Route path="/admin-dashboard/users" element={<UserList />}></Route>
          <Route path="/admin-dashboard/users/add" element={<AddUser />}></Route>
          <Route path="/admin-dashboard/users/:id" element={<EditUser />} />

          <Route path="/admin-dashboard/seller" element={<SellerList />}></Route>
          <Route path="/admin-dashboard/seller/add" element={<AddSeller />}></Route>
          <Route path="/admin-dashboard/seller/:id" element={<EditSeller />} />

          <Route path="/admin-dashboard/sandbox" element={<SandboxPanel />}></Route>

          <Route path="/admin-dashboard/buyer/add/" element={<ListOfBuyer />}></Route>
          <Route path="/admin-dashboard/buyer/adding/" element={<AddBuyer />}></Route>
          <Route path="/admin-dashboard/buyer/:id" element={<BuyerEdit />} />

          <Route path="/admin-dashboard/items" element={<ItemsList />}></Route>
          <Route path="/admin-dashboard/items/add" element={<AddItems />}></Route>
          <Route path="/admin-dashboard/items/:id" element={<EditItems />} />

          <Route path="/admin-dashboard/invoice" element={<InvoiceList />}></Route>
          <Route path="/admin-dashboard/invoice/add" element={<AddInvoice />}></Route>
          <Route path="/admin-dashboard/invoice/edit/:id" element={<AddInvoice />}></Route>
          <Route path="/admin-dashboard/invoice/view/:id" element={<InvoicePdf />}></Route>
        </Route>

        {/* Seller Dashboard Routes */}
        <Route path="/seller-dashboard" element={
          <PrivateRoute>
            <RoleBaseRoute requiredRole={["Employee"]}>
              <SellerDashboard/>
            </RoleBaseRoute>
          </PrivateRoute>
        }>
          <Route index element={<SellerSummary/>}></Route>
          <Route path="/seller-dashboard/buyer/add/" element={<ListOfBuyer />}></Route>
          <Route path="/seller-dashboard/buyer/adding/" element={<AddBuyer />}></Route>
          <Route path="/seller-dashboard/buyer/:id" element={<BuyerEdit />} />
          <Route path="/seller-dashboard/items" element={<ItemsList />}></Route> 
          <Route path="/seller-dashboard/items/add" element={<AddItems />}></Route>
          <Route path="/seller-dashboard/items/:id" element={<EditItems />} /> 
          <Route path="/seller-dashboard/invoice" element={<InvoiceList />}></Route>
          <Route path="/seller-dashboard/invoice/add" element={<AddInvoice />}></Route>
          <Route path="/seller-dashboard/invoice/edit/:id" element={<AddInvoice />}></Route>
          <Route path="/seller-dashboard/invoice/view/:id" element={<InvoicePdf />}></Route>
        </Route>

      </Routes>
     </BrowserRouter>
    </TooltipProvider>
  );
}

export default App
