import React from 'react'
import { useAuth } from '../context/authContext'
import { Navigate } from 'react-router-dom'

const RoleBaseRoute = ({children, requiredRole}) => {
  const {user, loading} = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  const normalizedRole = (user.role || "").toLowerCase();
  const normalizedRequired = (requiredRole || []).map((role) => role.toLowerCase());

  if (!normalizedRequired.includes(normalizedRole)) {
    return <Navigate to="/unauthorized" />
  }
  
  return children
}

export default RoleBaseRoute
