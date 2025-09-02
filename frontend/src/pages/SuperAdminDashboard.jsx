import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ 
    username: "", 
    password: "", 
    role: "waiter", 
    firstName: "", 
    lastName: "", 
    email: "",
    phone: ""
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    totalRevenue: 0,
    systemHealth: 95,
    totalOrders: 0,
    totalCustomers: 0
  });
  const [systemLogs, setSystemLogs] = useState([]);
  const [restaurantSettings, setRestaurantSettings] = useState({
    name: "QR Restaurant",
    address: "123 Restaurant Street",
    phone: "+91-9876543210",
    email: "info@qrrestaurant.com",
    gst: 18,
    serviceCharge: 10,
    maxTableCapacity: 50
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchSystemStats(),
        fetchSystemLogs()
      ]);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token") || user?.token;
      const res = await axios.get("/users", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (res.data.success) {
        setUsers(res.data.data);
      } else {
        // Demo data for development
        const demoUsers = [
          {
            _id: "1",
            firstName: "John",
            lastName: "Doe",
            username: "john.waiter",
            role: "waiter",
            email: "john@restaurant.com",
            phone: "+91-9876543210",
            status: "active",
            createdAt: new Date(),
            lastLogin: new Date()
          },
          {
            _id: "2",
            firstName: "Jane",
            lastName: "Smith",
            username: "jane.kitchen",
            role: "kitchen",
            email: "jane@restaurant.com",
            phone: "+91-9876543211",
            status: "active",
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            _id: "3",
            firstName: "Mike",
            lastName: "Wilson",
            username: "mike.cashier",
            role: "cashier",
            email: "mike@restaurant.com",
            phone: "+91-9876543212",
            status: "inactive",
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        ];
        setUsers(demoUsers);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const res = await axios.get("/analytics/super-admin-stats");
      if (res.data.success) {
        setStats(res.data.data);
      } else {
        setStats({
          totalStaff: 12,
          activeStaff: 8,
          totalRevenue: 125750,
          systemHealth: 98,
          totalOrders: 156,
          totalCustomers: 89
        });
      }
    } catch (error) {
      console.error("Failed to fetch system stats:", error);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const res = await axios.get("/system/logs");
      if (res.data.success) {
        setSystemLogs(res.data.data);
      } else {
        setSystemLogs([
          {
            _id: "1",
            type: "login",
            user: "john.waiter",
            action: "User login",
            timestamp: new Date(Date.now() - 10 * 60000),
            status: "success"
          },
          {
            _id: "2",
            type: "order",
            user: "system",
            action: "New order placed - Table T05",
            timestamp: new Date(Date.now() - 25 * 60000),
            status: "info"
          },
          {
            _id: "3",
            type: "error",
            user: "system",
            action: "Payment gateway timeout",
            timestamp: new Date(Date.now() - 45 * 60000),
            status: "warning"
          }
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch system logs:", error);
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token") || user?.token;
      const res = await axios.post("/users", newUser, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (res.data.success) {
        await fetchUsers();
        setNewUser({ 
          username: "", 
          password: "", 
          role: "waiter", 
          firstName: "", 
          lastName: "",
          email: "",
          phone: ""
        });
        
        const event = new CustomEvent('showToast', {
          detail: { message: `Staff member ${newUser.firstName} ${newUser.lastName} added successfully!`, type: 'success' }
        });
        window.dispatchEvent(event);
      } else {
        throw new Error(res.data.message || "Failed to add user");
      }
    } catch (err) {
      console.error("Failed to add user:", err);
      const event = new CustomEvent('showToast', {
        detail: { message: "Failed to add staff member. Please try again.", type: 'error' }
      });
      window.dispatchEvent(event);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token") || user?.token;
      await axios.delete(`/users/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      await fetchUsers();
      
      const event = new CustomEvent('showToast', {
        detail: { message: `Staff member ${userName} deleted successfully.`, type: 'success' }
      });
      window.dispatchEvent(event);
    } catch (err) {
      console.error("Failed to delete user:", err);
      const event = new CustomEvent('showToast', {
        detail: { message: "Failed to delete staff member. Please try again.", type: 'error' }
      });
      window.dispatchEvent(event);
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const token = localStorage.getItem("token") || user?.token;
      
      await axios.patch(`/users/${id}`, { status: newStatus }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      await fetchUsers();
      
      const event = new CustomEvent('showToast', {
        detail: { message: `User status updated to ${newStatus}.`, type: 'success' }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const updateRestaurantSettings = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || user?.token;
      const res = await axios.post("/settings/restaurant", restaurantSettings, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (res.data.success) {
        const event = new CustomEvent('showToast', {
          detail: { message: "Restaurant settings updated successfully!", type: 'success' }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      const event = new CustomEvent('showToast', {
        detail: { message: "Failed to update settings. Please try again.", type: 'error' }
      });
      window.dispatchEvent(event);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'cashier': return 'bg-green-100 text-green-800';
      case 'kitchen': return 'bg-orange-100 text-orange-800';
      case 'waiter': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const tabs = [
    { id: "overview", name: "System Overview", icon: "📊" },
    { id: "staff", name: "Staff Management", icon: "👥" },
    { id: "settings", name: "Restaurant Settings", icon: "⚙️" },
    { id: "logs", name: "System Logs", icon: "📝" }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-3">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  👑 Super Admin Dashboard
                </h2>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.username} • System Administrator
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchDashboardData}
                  className="btn-outline btn-sm"
                  disabled={loading}
                >
                  🔄 {loading ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* System Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <div className="card text-center">
                  <div className="text-3xl text-blue-600 mb-2">👥</div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalStaff}</h3>
                  <p className="text-gray-600">Total Staff</p>
                  <p className="text-xs text-green-600 mt-1">{stats.activeStaff} active</p>
                </div>
                
                <div className="card text-center">
                  <div className="text-3xl text-green-600 mb-2">💰</div>
                  <h3 className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue?.toLocaleString()}</h3>
                  <p className="text-gray-600">Total Revenue</p>
                  <p className="text-xs text-green-600 mt-1">↑ 15% this month</p>
                </div>
                
                <div className="card text-center">
                  <div className="text-3xl text-purple-600 mb-2">🔧</div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.systemHealth}%</h3>
                  <p className="text-gray-600">System Health</p>
                  <p className="text-xs text-purple-600 mt-1">Excellent</p>
                </div>
                
                <div className="card text-center">
                  <div className="text-3xl text-orange-600 mb-2">📋</div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalOrders}</h3>
                  <p className="text-gray-600">Total Orders</p>
                  <p className="text-xs text-orange-600 mt-1">Today</p>
                </div>
                
                <div className="card text-center">
                  <div className="text-3xl text-teal-600 mb-2">👤</div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</h3>
                  <p className="text-gray-600">Customers</p>
                  <p className="text-xs text-teal-600 mt-1">Today</p>
                </div>
                
                <div className="card text-center">
                  <div className="text-3xl text-red-600 mb-2">⚡</div>
                  <h3 className="text-2xl font-bold text-gray-900">Online</h3>
                  <p className="text-gray-600">System Status</p>
                  <p className="text-xs text-red-600 mt-1">All services</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab("staff")}
                    className="btn-primary text-left p-4"
                  >
                    <div className="text-2xl mb-2">👥</div>
                    <h4 className="font-semibold">Manage Staff</h4>
                    <p className="text-sm opacity-90">Add, edit, or remove staff members</p>
                  </button>
                  
                  <button
                    onClick={() => navigate("/admin")}
                    className="btn-outline text-left p-4"
                  >
                    <div className="text-2xl mb-2">📊</div>
                    <h4 className="font-semibold">View Analytics</h4>
                    <p className="text-sm">Detailed business reports</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="btn-outline text-left p-4"
                  >
                    <div className="text-2xl mb-2">⚙️</div>
                    <h4 className="font-semibold">System Settings</h4>
                    <p className="text-sm">Configure restaurant settings</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("logs")}
                    className="btn-outline text-left p-4"
                  >
                    <div className="text-2xl mb-2">📝</div>
                    <h4 className="font-semibold">System Logs</h4>
                    <p className="text-sm">Monitor system activity</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Staff Management Tab */}
          {activeTab === "staff" && (
            <div className="space-y-6">
              {/* Add User Form */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">➕ Add New Staff Member</h3>
                
                <form onSubmit={addUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input 
                        type="text" 
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter first name"
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input 
                        type="text" 
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter last name"
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input 
                        type="text" 
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter username"
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input 
                        type="password" 
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter password"
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        type="email" 
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input 
                        type="tel" 
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="waiter">🍽️ Waiter</option>
                      <option value="kitchen">👨‍🍳 Kitchen Staff</option>
                      <option value="cashier">💳 Cashier</option>
                      <option value="manager">📊 Manager</option>
                      <option value="admin">👨‍💼 Admin</option>
                      <option value="superadmin">👑 Super Admin</option>
                    </select>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading}
                    className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Adding Staff...' : '✨ Add Staff Member'}
                  </button>
                </form>
              </div>

              {/* Staff List */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Staff Directory ({users.length} members)</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Username</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Last Login</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                              {user.email && (
                                <p className="text-sm text-gray-600">{user.email}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{user.username}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {user.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status || 'active')}`}>
                              {(user.status || 'active').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => toggleUserStatus(user._id, user.status || 'active')}
                                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                              >
                                {(user.status || 'active') === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              {user.role !== 'superadmin' && (
                                <button
                                  onClick={() => deleteUser(user._id, `${user.firstName} ${user.lastName}`)}
                                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Restaurant Settings Tab */}
          {activeTab === "settings" && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Restaurant Configuration</h3>
              
              <form onSubmit={updateRestaurantSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                    <input 
                      type="text" 
                      value={restaurantSettings.name}
                      onChange={(e) => setRestaurantSettings({ ...restaurantSettings, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={restaurantSettings.phone}
                      onChange={(e) => setRestaurantSettings({ ...restaurantSettings, phone: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea 
                      value={restaurantSettings.address}
                      onChange={(e) => setRestaurantSettings({ ...restaurantSettings, address: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={restaurantSettings.email}
                      onChange={(e) => setRestaurantSettings({ ...restaurantSettings, email: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Table Capacity</label>
                    <input 
                      type="number" 
                      value={restaurantSettings.maxTableCapacity}
                      onChange={(e) => setRestaurantSettings({ ...restaurantSettings, maxTableCapacity: parseInt(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={restaurantSettings.gst}
                      onChange={(e) => setRestaurantSettings({ ...restaurantSettings, gst: parseFloat(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={restaurantSettings.serviceCharge}
                      onChange={(e) => setRestaurantSettings({ ...restaurantSettings, serviceCharge: parseFloat(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <button type="submit" className="btn-primary">
                  💾 Save Settings
                </button>
              </form>
            </div>
          )}

          {/* System Logs Tab */}
          {activeTab === "logs" && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 System Activity Logs</h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {systemLogs.map((log) => (
                  <div key={log._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getLogTypeColor(log.status)}`}>
                      {log.type.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-600">
                        {log.user} • {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
