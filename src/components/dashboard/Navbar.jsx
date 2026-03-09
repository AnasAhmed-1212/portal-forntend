import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/authContext";
import { FaBars, FaSignOutAlt } from "react-icons/fa";

const Navbar = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "NA";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-72 h-16 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between px-4 lg:px-6 shadow-sm z-30">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen?.(true)}
        className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <FaBars className="w-5 h-5" />
      </button>

      {/* Welcome Message - Mobile Center */}
      <div className="absolute left-1/2 -translate-x-[59%] text-center md:hidden pointer-events-none">
        <p className="text-[11px] text-slate-300 leading-3">Welcome back,</p>
        <p className="text-sm font-semibold text-white leading-5">{user?.name || "User"}</p>
      </div>

      {/* Welcome Message - Desktop Left */}
      <div className="hidden md:flex items-center">
        <div>
          <p className="text-xs text-slate-300">Welcome back,</p>
          <p className="text-sm font-semibold text-white">{user?.name}</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4 relative" ref={profileRef}>
        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-shadow shadow-sm"
          aria-label="Logout"
        >
          <FaSignOutAlt className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        {/* User Avatar */}
        <button
          onClick={() => setShowProfile((prev) => !prev)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm text-white transition-all ${
            showProfile ? "bg-white/20 ring-2 ring-blue-400/80" : "bg-white/10 hover:bg-white/20"
          }`}
          aria-label="Open profile"
          aria-expanded={showProfile}
          aria-haspopup="menu"
        >
          {initials}
        </button>

        {showProfile && (
          <div className="absolute right-0 top-12 w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-4 z-50">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Profile</p>
            <p className="text-sm font-semibold text-slate-900">{user?.name || "User"}</p>
            <p className="text-xs text-slate-600 mt-1 break-all">{user?.email || "No email available"}</p>
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
              Role: <span className="font-medium text-slate-800">{user?.role || "N/A"}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
