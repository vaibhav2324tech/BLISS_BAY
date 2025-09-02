import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../api/axios";
import socket from "../utils/socket";

export default function WaiterDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customerRequests, setCustomerRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tables");
  const [stats, setStats] = useState({
    assignedTables: 0,
    activeOrders: 0,
    pendingRequests: 0,
    avgServiceTime: 12
  });

  useEffect(() => {
    fetchWaiterData();
    
    // Real-time updates
    socket.on("table:update", handleTableUpdate);
    socket.on("order:new", handleOrderNew);
    socket.on("order:update", handleOrderUpdate);
    socket.on("customer:request", handleCustomerRequest);
    
    return () => {
      socket.off("table:update");
      socket.off("order:new");
      socket.off("order:update");
      socket.off("customer:request");
    };
  }, []);

  const fetchWaiterData = async () => {
    setLoading(true);
    try {
      // Fetch assigned tables
      const tablesRes = await axios.get(`/waiter/${user.username}/tables`);
      
      // Fetch active orders
      const ordersRes = await axios.get("/orders", {
        params: { 
          status: "pending,preparing,ready", 
          waiter: user.username 
        }
      });
      
      // Fetch customer requests
      const requestsRes = await axios.get(`/waiter/${user.username}/requests`);

      if (tablesRes.data.success) {
        setTables(tablesRes.data.data);
      } else {
        // Demo data
        const demoTables = [
          {
            id: "T01",
            status: "occupied",
            capacity: 4,
            currentGuests: 3,
            waiter: user.username,
            orderStatus: "ordering",
            timeSeated: new Date(Date.now() - 20 * 60000)
          },
          {
            id: "T05",
            status: "available",
            capacity: 2,
            currentGuests: 0,
            waiter: user.username,
            orderStatus: null,
            timeSeated: null
          },
          {
            id: "T08",
            status: "occupied",
            capacity: 6,
            currentGuests: 5,
            waiter: user.username,
            orderStatus: "served",
            timeSeated: new Date(Date.now() - 45 * 60000)
          }
        ];
        setTables(demoTables);
      }

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
      } else {
        // Demo orders
        const demoOrders = [
          {
            _id: "order1",
            tableNumber: "T01",
            status: "preparing",
            items: [
              { menuItem: { name: "Margherita Pizza" }, quantity: 2 },
              { menuItem: { name: "Caesar Salad" }, quantity: 1 }
            ],
            createdAt: new Date(Date.now() - 15 * 60000)
          },
          {
            _id: "order2",
            tableNumber: "T08",
            status: "ready",
            items: [
              { menuItem: { name: "Grilled Chicken" }, quantity: 1 }
            ],
            createdAt: new Date(Date.now() - 25 * 60000)
          }
        ];
        setOrders(demoOrders);
      }

      if (requestsRes.data.success) {
        setCustomerRequests(requestsRes.data.data);
      } else {
        // Demo requests
        const demoRequests = [
          {
            _id: "req1",
            tableNumber: "T01",
            type: "assistance",
            message: "Need extra napkins",
            createdAt: new Date(Date.now() - 5 * 60000),
            status: "pending"
          },
          {
            _id: "req2",
            tableNumber: "T08",
            type: "bill",
            message: "Request final bill",
            createdAt: new Date(Date.now() - 2 * 60000),
            status: "pending"
          }
        ];
        setCustomerRequests(demoRequests);
      }

      // Update stats
      setStats({
        assignedTables: 6,
        activeOrders: 3,
        pendingRequests: 2,
        avgServiceTime: 12
      });

    } catch (error) {
      console.error("Failed to fetch waiter data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableUpdate = (updatedTable) => {
    setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
  };

  const handleOrderNew = (order) => {
    // Check if order is for waiter's table
    const isMyTable = tables.some(t => t.id === order.tableNumber);
    if (isMyTable) {
      setOrders(prev => [order, ...prev]);
      
      // Show notification
      const event = new CustomEvent('showToast', {
        detail: { 
          message: `New order received for Table ${order.tableNumber}!`, 
          type: 'info' 
        }
      });
      window.dispatchEvent(event);
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    
    if (updatedOrder.status === 'ready') {
      const event = new CustomEvent('showToast', {
        detail: { 
          message: `Order ready for Table ${updatedOrder.tableNumber}!`, 
          type: 'success' 
        }
      });
      window.dispatchEvent(event);
    }
  };

  const handleCustomerRequest = (request) => {
    setCustomerRequests(prev => [request, ...prev]);
    
    // Show notification
    const event = new CustomEvent('showToast', {
      detail: { 
        message: `Customer request from Table ${request.tableNumber}`, 
        type: 'warning' 
      }
    });
    window.dispatchEvent(event);
  };

  const markRequestCompleted = async (requestId) => {
    try {
      const res = await axios.patch(`/requests/${requestId}`, { status: 'completed' });
      
      if (res.data.success) {
        setCustomerRequests(prev => prev.filter(r => r._id !== requestId));
        
        const event = new CustomEvent('showToast', {
          detail: { message: "Request marked as completed", type: 'success' }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Failed to update request:", error);
    }
  };

  const updateTableStatus = async (tableId, newStatus) => {
    try {
      const res = await axios.patch(`/tables/${tableId}`, { status: newStatus });
      
      if (res.data.success) {
        setTables(prev => prev.map(t => 
          t.id === tableId ? { ...t, status: newStatus } : t
        ));
        
        const event = new CustomEvent('showToast', {
          detail: { message: `Table ${tableId} status updated`, type: 'success' }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Failed to update table:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-red-100 text-red-800 border-red-300';
      case 'available': return 'bg-green-100 text-green-800 border-green-300';
      case 'cleaning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'reserved': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeElapsed = (date) => {
    const minutes = Math.floor((Date.now() - new Date(date)) / 60000);
    return `${minutes}m ago`;
  };

  const tabs = [
    { id: "tables", name: "My Tables", icon: "🏪" },
    { id: "orders", name: "Active Orders", icon: "📋" },
    { id: "requests", name: "Customer Requests", icon: "🔔" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  🍽️ Waiter Dashboard
                </h2>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.username} • Table Service
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchWaiterData}
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl text-blue-600 mb-2">🏪</div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.assignedTables}</h3>
            <p className="text-gray-600">Assigned Tables</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl text-orange-600 mb-2">📋</div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.activeOrders}</h3>
            <p className="text-gray-600">Active Orders</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl text-red-600 mb-2">🔔</div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</h3>
            <p className="text-gray-600">Pending Requests</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl text-teal-600 mb-2">⏱️</div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.avgServiceTime}min</h3>
            <p className="text-gray-600">Avg Service Time</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-teal-300 hover:bg-teal-50'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tables Tab */}
        {activeTab === "tables" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">My Assigned Tables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map((table) => (
                <div key={table.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold text-gray-900">{table.id}</h4>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getTableStatusColor(table.status)}`}>
                      {table.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <span className="font-medium">{table.capacity} seats</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Guests:</span>
                      <span className="font-medium">{table.currentGuests}</span>
                    </div>
                    {table.timeSeated && (
                      <div className="flex justify-between">
                        <span>Seated:</span>
                        <span className="font-medium">{getTimeElapsed(table.timeSeated)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex space-x-2">
                    {table.status === 'available' && (
                      <button
                        onClick={() => updateTableStatus(table.id, 'cleaning')}
                        className="flex-1 btn-outline btn-sm"
                      >
                        🧹 Clean
                      </button>
                    )}
                    {table.status === 'cleaning' && (
                      <button
                        onClick={() => updateTableStatus(table.id, 'available')}
                        className="flex-1 btn-primary btn-sm"
                      >
                        ✅ Ready
                      </button>
                    )}
                    {table.status === 'occupied' && (
                      <button
                        onClick={() => navigate(`/menu?table=${table.id}`)}
                        className="flex-1 btn-primary btn-sm"
                      >
                        📱 Take Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Orders</h3>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No active orders</h3>
                <p className="text-gray-500">All orders are up to date!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">Table {order.tableNumber}</h4>
                        <p className="text-sm text-gray-600">Order #{order._id.slice(-6)}</p>
                        <p className="text-xs text-gray-500">{getTimeElapsed(order.createdAt)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      {order.items?.map((item, index) => (
                        <div key={index} className="text-sm text-gray-700">
                          {item.menuItem?.name || 'Menu Item'} × {item.quantity}
                        </div>
                      ))}
                    </div>

                    {order.status === 'ready' && (
                      <button
                        onClick={() => navigate(`/bill`, { state: { orderId: order._id, tableNumber: order.tableNumber } })}
                        className="btn-primary btn-sm w-full"
                      >
                        🍽️ Serve & Bill
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Customer Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer Requests</h3>
            {customerRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔔</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No pending requests</h3>
                <p className="text-gray-500">All customer requests have been handled!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {customerRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">Table {request.tableNumber}</h4>
                        <p className="text-sm text-gray-600 capitalize">{request.type} Request</p>
                        <p className="text-xs text-gray-500">{getTimeElapsed(request.createdAt)}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        PENDING
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3 text-sm">{request.message}</p>

                    <button
                      onClick={() => markRequestCompleted(request._id)}
                      className="btn-primary btn-sm w-full"
                    >
                      ✅ Mark Completed
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
