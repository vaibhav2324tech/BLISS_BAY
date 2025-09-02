import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../api/axios";
import socket from "../utils/socket";

export default function KitchenDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("all");
  const [stats, setStats] = useState({
    pending: 0,
    preparing: 0,
    ready: 0,
    avgPrepTime: 15
  });

  useEffect(() => {
    fetchKitchenOrders();
    
    // Real-time order updates
    socket.on("order:new", handleNewOrder);
    socket.on("order:update", handleOrderUpdate);
    
    return () => {
      socket.off("order:new");
      socket.off("order:update");
    };
  }, []);

  const fetchKitchenOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/orders", {
        params: {
          status: "pending,preparing,ready",
          sortBy: "createdAt",
          order: "asc"
        }
      });
      
      if (res.data.success) {
        setOrders(res.data.data);
        updateStats(res.data.data);
      } else {
        // Demo data for development
        const demoOrders = [
          {
            _id: "order1",
            tableNumber: "T01",
            status: "pending",
            createdAt: new Date(),
            items: [
              { _id: "1", menuItem: { name: "Margherita Pizza" }, quantity: 2, section: "kitchen" },
              { _id: "2", menuItem: { name: "Caesar Salad" }, quantity: 1, section: "cold" }
            ]
          },
          {
            _id: "order2", 
            tableNumber: "T03",
            status: "preparing",
            createdAt: new Date(Date.now() - 10 * 60000),
            items: [
              { _id: "3", menuItem: { name: "Grilled Chicken" }, quantity: 1, section: "grill" }
            ]
          }
        ];
        setOrders(demoOrders);
        updateStats(demoOrders);
      }
    } catch (error) {
      console.error("Failed to fetch kitchen orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (orderList) => {
    const pending = orderList.filter(o => o.status === "pending").length;
    const preparing = orderList.filter(o => o.status === "preparing").length;
    const ready = orderList.filter(o => o.status === "ready").length;
    
    setStats({ pending, preparing, ready, avgPrepTime: 15 });
  };

  const handleNewOrder = (order) => {
    setOrders(prev => [order, ...prev]);
    // Show notification
    const event = new CustomEvent('showToast', {
      detail: { message: `New order received for Table ${order.tableNumber}!`, type: 'info' }
    });
    window.dispatchEvent(event);
  };

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.patch(`/orders/${orderId}`, { status: newStatus });
      
      if (res.data.success) {
        setOrders(prev => prev.map(o => 
          o._id === orderId ? { ...o, status: newStatus } : o
        ));
        
        const statusMessages = {
          preparing: "Order moved to preparing",
          ready: "Order marked as ready", 
          completed: "Order completed"
        };
        
        const event = new CustomEvent('showToast', {
          detail: { message: statusMessages[newStatus], type: 'success' }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      const event = new CustomEvent('showToast', {
        detail: { message: "Failed to update order status", type: 'error' }
      });
      window.dispatchEvent(event);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getOrderAge = (createdAt) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt)) / 60000);
    return minutes;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredOrders = activeSection === "all" 
    ? orders 
    : orders.filter(order => 
        order.items.some(item => item.section === activeSection)
      );

  const sections = [
    { id: "all", name: "All Orders", icon: "🍽️" },
    { id: "kitchen", name: "Kitchen", icon: "🍳" },
    { id: "grill", name: "Grill", icon: "🔥" },
    { id: "cold", name: "Cold Prep", icon: "🥗" },
    { id: "bar", name: "Bar", icon: "🍹" }
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
                  👨‍🍳 Kitchen Operations
                </h2>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.username} • Kitchen Staff
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchKitchenOrders}
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
            <div className="text-3xl text-yellow-600 mb-2">⏳</div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pending}</h3>
            <p className="text-gray-600">Pending Orders</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl text-blue-600 mb-2">🍳</div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.preparing}</h3>
            <p className="text-gray-600">Preparing</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl text-green-600 mb-2">✅</div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.ready}</h3>
            <p className="text-gray-600">Ready</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl text-teal-600 mb-2">⏱️</div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.avgPrepTime}min</h3>
            <p className="text-gray-600">Avg Prep Time</p>
          </div>
        </div>

        {/* Section Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-teal-300 hover:bg-teal-50'
                }`}
              >
                {section.icon} {section.name}
              </button>
            ))}
          </div>
        </div>

        {/* Kitchen Order Tickets (KOT) */}
        <div className="space-y-4">
          {loading && filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading kitchen orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">All caught up!</h3>
              <p className="text-gray-500">No pending orders in the kitchen queue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
                <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">Table {order.tableNumber}</h3>
                        <p className="text-xs text-gray-500">
                          Order: #{order._id.slice(-6)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {getOrderAge(order.createdAt)}m ago
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4">
                    <div className="space-y-3 mb-4">
                      {order.items.map((item) => (
                        <div key={item._id} className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {item.menuItem?.name || 'Menu Item'}
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <span>Qty: {item.quantity}</span>
                              {item.section && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className="capitalize">{item.section}</span>
                                </>
                              )}
                            </div>
                            {item.specialInstructions && (
                              <p className="text-xs text-orange-600 italic mt-1">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-900">
                              {item.quantity}x
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'preparing')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                        >
                          🍳 Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'ready')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                        >
                          ✅ Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'completed')}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                        >
                          🚀 Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
