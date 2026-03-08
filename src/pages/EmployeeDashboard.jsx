import React from 'react'
import Navbar from "../components/dashboard/Navbar.jsx";
import AdminSideBar from "../components/dashboard/AdminSideBar.jsx";

const EmployeeDashboard = () => {
  return (
    <div className="flex">
      <AdminSideBar />
      <div className="flex-1">
        <Navbar/>
        
      </div>
    </div>
  )
}

export default EmployeeDashboard
