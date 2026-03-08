import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaPeopleCarry,
  FaProductHunt,
  FaTimes,
  FaUsers,
  FaBuilding,
} from "react-icons/fa";

const AdminSideBar = ({ isOpen, setIsOpen }) => {
  const linkClasses = ({ isActive }) =>
    `group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ` +
    (isActive
      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
      : "text-slate-200 hover:bg-slate-800 hover:text-white/95");

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 
        bg-gradient-to-b from-slate-900 to-slate-800 text-white 
        shadow-2xl flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close Button - Mobile Only */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 lg:hidden p-2 text-slate-400 hover:text-white"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div className="text-lg font-semibold">Fileredge</div>
            <div className="text-xs text-slate-300">Invoicing System</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-2 flex-1 overflow-auto">
          <NavLink to="/admin-dashboard" end className={linkClasses} onClick={() => setIsOpen(false)}>
            <FaTachometerAlt className="w-5 h-5 text-slate-100 group-hover:text-white/95" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/admin-dashboard/users" className={linkClasses} onClick={() => setIsOpen(false)}>
            <FaUsers className="w-5 h-5 text-slate-100 group-hover:text-white/95" />
            <span>Users</span>
          </NavLink>

          <NavLink to="/admin-dashboard/seller" className={linkClasses} onClick={() => setIsOpen(false)}>
            <FaBuilding className="w-5 h-5 text-slate-100 group-hover:text-white/95" />
            <span>Sellers</span>
          </NavLink>
        </nav>

        {/* Support Button */}
        <div className="px-4 py-4 border-t border-slate-700">
          <button className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-100 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-slate-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Support</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSideBar;
