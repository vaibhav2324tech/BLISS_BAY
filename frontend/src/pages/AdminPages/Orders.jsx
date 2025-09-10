import React, { useState, useEffect } from 'react';
// import axios from 'axios';
import axios from "../../api/axios";
function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    preparing: 0,
    served: 0
  });

  const fetchKitchenOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/orders/orders");
      console.log(res.data.response)

      if (res.data.response) {
        // Map response to the format your UI expects
        const formattedOrders = res.data.response.map(order => ({
          ...order,
          tableNumber: order.tableId.tableNumber || "N/A", // adapt if you want table numbers
          status: order.status, // convert "PENDING" → "pending"
          items: order.items.map(item => ({
            _id: item._id,
            menuItem: { name: item.name },
            quantity: item.quantity,
            price: item.price,
            section: "kitchen" // or assign dynamically if your backend provides it
          }))
        }));

        setOrders(formattedOrders);
        updateStats(formattedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch kitchen orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (ordersList) => {
    const stats = {
      total: ordersList.length,
      pending: ordersList.filter(order => order.status === 'PENDING').length,
      preparing: ordersList.filter(order => order.status === 'PREPARING').length,
      served: ordersList.filter(order => order.status === 'SERVED').length
    };
    setStats(stats);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchKitchenOrders(); // Refresh orders after status update
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SERVED':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '⏳';
      case 'PREPARING':
        return '👨‍🍳';
      case 'SERVED':
        return '✅';
      default:
        return '📋';
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  useEffect(() => {
    fetchKitchenOrders();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchKitchenOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🍽️ Kitchen Orders
          </h1>
          <p className="text-lg text-gray-600">
            Real-time order management and tracking
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">⏳</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">👨‍🍳</div>
              <div className="text-2xl font-bold text-blue-600">{stats.preparing}</div>
              <div className="text-sm text-gray-600">Preparing</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-2xl font-bold text-green-600">{stats.served}</div>
              <div className="text-sm text-gray-600">Served</div>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">Orders will appear here as they come in</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🏪</span>
                      <span className="font-semibold text-gray-900">
                        Table {order.tableNumber}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>📅 {formatDate(order.createdAt)}</span>
                    <span>⏰ {formatTime(order.createdAt)}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🍛</span>
                    Order Items ({order.items.length})
                  </h4>
                  
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {item.menuItem.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            Qty: {item.quantity} × ₹{item.price}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            ₹{item.price * item.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">💰 Total Amount</span>
                      <span className="font-bold text-lg text-teal-600">
                        ₹{calculateTotal(order.items)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {order.status !== 'SERVED' && (
                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex space-x-2">
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'PREPARING')}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          👨‍🍳 Start Preparing
                        </button>
                      )}
                      
                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'SERVED')}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          ✅ Mark as Served
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Time Info */}
                {order.updatedAt !== order.createdAt && (
                  <div className="px-4 pb-4">
                    <div className="text-xs text-gray-500 text-center">
                      Last updated: {formatTime(order.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={fetchKitchenOrders}
            disabled={loading}
            className={`px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-200 font-medium ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block mr-2">⟳</span>
                Refreshing...
              </>
            ) : (
              <>
                <span className="mr-2">🔄</span>
                Refresh Orders
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>🔄 Orders auto-refresh every 30 seconds</p>
          <p className="mt-1">Kitchen Management System</p>
        </div>
      </div>
    </div>
  );
}

export default Orders;