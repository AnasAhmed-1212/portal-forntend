import { API_BASE_URL } from "../../lib/api";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaToggleOn, FaToggleOff, FaSearch } from "react-icons/fa";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/user/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const data = response.data.data.map((user, index) => ({
          _id: user._id,
          sno: index + 1,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          sellerId: user.sellerId,
          sellerBusinessName: user.sellerId?.sellerBusinessName || "Not Assigned",
          sellerIsActive: user.sellerId?.isActive ?? null,
        }));
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  // Toggle user status
  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_BASE_URL}/api/user/${id}/toggle-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        // Update local state
        const updatedUsers = users.map((user) =>
          user._id === id
            ? { ...user, isActive: response.data.data.isActive }
            : user
        );
        setUsers(updatedUsers);
        alert(response.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.error || "Error toggling user status");
    }
  };

  // Delete user
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${API_BASE_URL}/api/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const updatedUsers = users.filter((user) => user._id !== id);
        setUsers(updatedUsers);
        alert("User deleted successfully");
      }
    } catch (error) {
      alert(error.response?.data?.error || "Error deleting user");
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.sellerBusinessName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Table columns
  const columns = [
    { name: "S.No", selector: (row) => row.sno, sortable: true },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Email", selector: (row) => row.email, sortable: true },
    { name: "Role", selector: (row) => row.role, sortable: true },
    { name: "Assigned Seller", selector: (row) => row.sellerBusinessName, sortable: true },
    { name: "Status", selector: (row) => row.isActive ? "Active" : "Inactive", sortable: true },
    { name: "Actions", selector: (row) => row._id },
  ];

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="secondary" className="mb-3">Access control</Badge>
            <h1 className="page-heading">User management</h1>
            <p className="page-description">Manage portal users and their assigned seller accounts.</p>
          </div>
          <Button asChild size="lg" className="h-10"><Link to="/admin-dashboard/users/add"><FaPlus />Add user</Link></Button>
        </div>

        <Card className="mb-4 gap-0 py-0">
          <CardContent className="p-4">
            <div className="relative w-full md:max-w-md">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden py-0">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>{columns.map((column) => <TableHead key={column.name}>{column.name}</TableHead>)}</TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">No users found.</TableCell></TableRow>
                  ) : filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="text-muted-foreground">{user.sno}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar size="sm"><AvatarFallback className="bg-primary text-xs text-primary-foreground">{user.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{user.role === "admin" && <FaUserShield />}{user.role}</Badge></TableCell>
                      <TableCell>
                        {user.sellerId ? (
                          <div className="flex items-center gap-2"><span>{user.sellerBusinessName}</span><span className={`size-2 rounded-full ${user.sellerIsActive ? "bg-emerald-500" : "bg-destructive"}`} /></div>
                        ) : <span className="text-muted-foreground">Not assigned</span>}
                      </TableCell>
                      <TableCell><Badge variant={user.isActive ? "secondary" : "destructive"}>{user.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleToggleStatus(user._id)} title={user.isActive ? "Deactivate" : "Activate"}>
                            {user.isActive ? <FaToggleOn className="text-emerald-600" /> : <FaToggleOff className="text-destructive" />}
                          </Button>
                          <Button asChild variant="ghost" size="icon-sm"><Link to={`/admin-dashboard/users/${user._id}`} title="Edit"><FaEdit /></Link></Button>
                          <Button type="button" variant="destructive" size="icon-sm" onClick={() => handleDelete(user._id)} title="Delete"><FaTrash /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserList;

