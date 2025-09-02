import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";
import socket from "../utils/socket";

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    todayRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    customerSatisfaction: 0,
    topItems: [],
    peakHours: "7:00 PM - 9:00 PM",
    tableOccupancy: 75
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [staff, setStaff] = useState([]);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Real-time updates
    socket.on("order:new", handleNewOrder);
    socket.on("order:update", handleOrderUpdate);
    socket.on("analytics:update", handleAnalyticsUpdate);
    
    return () => {
      socket.off("order:new");
      socket.off("order:update");
      socket.off("analytics:update");
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch orders
      const ordersRes = await axios.get("/orders", {
        params: { limit: 50, sortBy: "createdAt", order: "desc" }
      });
      
      // Fetch analytics
      const analyticsRes = await axios.get("/analytics/manager-dashboard");
      
      // Fetch staff and tables
      const staffRes = await axios.get("/staff");
      const tablesRes = await axios.get("/tables");

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
      } else {
        // Demo data
        const demoOrders = [
          {
            _id: "order1",
            tableNumber: "T01",
            status: "completed",
            total: 1250,
            createdAt: new Date(),
            items: [{ menuItem: { name: "Pizza" }, quantity: 2 }]
          },
          {
            _id: "order2",
            tableNumber: "T03",
            status: "preparing",
            total: 850,
            createdAt: new Date(Date.now() - 15 * 60000),
            items: [{ menuItem: { name: "Pasta" }, quantity: 1 }]
          }
        ];
        setOrders(demoOrders);
      }

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data);
      } else {
        setAnalytics({
          todayRevenue: 24750,
          totalOrders: 47,
          avgOrderValue: 526,
          customerSatisfaction: 4.8,
          topItems: [
            { name: "Margherita Pizza", count: 18 },
            { name: "Caesar Salad", count: 15 },
            { name: "Grilled Chicken", count: 12 }
          ],
          peakHours: "7:00 PM - 9:00 PM",
          tableOccupancy: 85
        });
      }

      // Set demo staff and tables
      setStaff([
        { name: "John Doe", role: "waiter", status: "active", shift: "morning" },
        { name: "Jane Smith", role: "kitchen", status: "active", shift: "evening" },
        { name: "Mike Wilson", role: "cashier", status: "break", shift: "evening" }
      ]);

      setTables([
        { id: "T01", status: "occupied", capacity: 4, currentGuests: 3 },
        { id: "T02", status: "available", capacity: 2, currentGuests: 0 },
        { id: "T03", status: "occupied", capacity: 6, currentGuests: 5 },
        { id: "T04", status: "cleaning", capacity: 4, currentGuests: 0 }
      ]);

    } catch (err) {
      console.error("Manager fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = (order) => {
    setOrders(prev => [order, ...prev]);
    // Update analytics
    setAnalytics(prev => ({
      ...prev,
      totalOrders: prev.totalOrders + 1,
      todayRevenue: prev.todayRevenue + order.total
    }));
  };

  const handleOrderUpdate = (updated) => {
    setOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
  };

  const handleAnalyticsUpdate = (newAnalytics) => {
    setAnalytics(newAnalytics);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'available': return 'bg-green-100 text-green-800';
      case 'cleaning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: "📊" },
    { id: "orders", name: "Orders", icon: "📋" },
    { id: "staff", name: "Staff", icon: "👥" },
    { id: "tables", name: "Tables", icon: "🏪" },
    { id: "analytics", name: "Analytics", icon: "📈" }
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
                  📊 Manager Dashboard
                </h2>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.username} • Restaurant Management
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
                      ? 'border-teal-500 text-teal-600'
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
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card text-center">
                  <div className="text-3xl text-green-600 mb-2">💰</div>
                  <h3 className="text-2xl font-bold text-gray-900">₹{analytics.todayRevenue?.toLocaleString()}</h3>
                  <p className="text-gray-600">Today's Revenue</p>
                  <p className="text-xs text-green-600 mt-1">↑ 12% from yesterday</p>
                </div>
                <div className="card text-center">
                  <div className="text-3xl text-blue-600 mb-2">📋</div>
                  <h3 className="text-2xl font-bold text-gray-900">{analytics.totalOrders}</h3>
                  <p className="text-gray-600">Total Orders</p>
                  <p className="text-xs text-blue-600 mt-1">↑ 8% from yesterday</p>
                </div>
                <div className="card text-center">
                  <div className="text-3xl text-teal-600 mb-2">💵</div>
                  <h3 className="text-2xl font-bold text-gray-900">₹{analytics.avgOrderValue}</h3>
                  <p className="text-gray-600">Avg Order Value</p>
                  <p className="text-xs text-teal-600 mt-1">↑ 5% this week</p>
                </div>
                <div className="card text-center">
                  <div className="text-3xl text-yellow-600 mb-2">⭐</div>
                  <h3 className="text-2xl font-bold text-gray-900">{analytics.customerSatisfaction}/5</h3>
                  <p className="text-gray-600">Customer Rating</p>
                  <p className="text-xs text-yellow-600 mt-1">Excellent rating</p>
                </div>
              </div>

              {/* Quick Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
                  <div className="space-y-3">
                    {analytics.topItems?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-medium text-gray-900">{item.count} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Insights</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Peak Hours:</span>
                      <span className="font-medium text-gray-900">{analytics.peakHours}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Table Occupancy:</span>
                      <span className="font-medium text-gray-900">{analytics.tableOccupancy}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Avg Table Turn:</span>
                      <span className="font-medium text-gray-900">45 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No orders to display</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <div key={order._id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Table {order.tableNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            Order #{order._id.slice(-6)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.toUpperCase()}
                          </span>
                          <p className="text-lg font-bold text-gray-900 mt-1">
                            ₹{order.total}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === "staff" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Staff Management</h3>
              <div className="grid gap-4">
                {staff.map((member, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                        <p className="text-xs text-gray-500">Shift: {member.shift}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' :
                        member.status === 'break' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tables Tab */}
          {activeTab === "tables" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Table Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map((table) => (
                  <div key={table.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900">{table.id}</h4>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getTableStatusColor(table.status)}`}>
                        {table.status.toUpperCase()}
                      </span>
                      <div className="mt-3 text-sm text-gray-600">
                        <p>Capacity: {table.capacity}</p>
                        <p>Current: {table.currentGuests}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Business Analytics</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h4 className="font-medium text-gray-900 mb-4">Revenue Trends</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">📊 Revenue chart will be displayed here</p>
                  </div>
                </div>
                
                <div className="card">
                  <h4 className="font-medium text-gray-900 mb-4">Order Volume</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">📈 Order volume chart will be displayed here</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
