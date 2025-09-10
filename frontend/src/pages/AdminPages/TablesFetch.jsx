import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';

function TablesFetch() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    occupied: 0,
    available: 0,
    reserved: 0
  });

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/tables");

      if (res.data.success && res.data.data) {
        setTables(res.data.data);
        updateStats(res.data.data);
      } else {
        setTables([]);
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (tablesList) => {
    const stats = {
      total: tablesList.length,
      occupied: tablesList.filter(table => table.status === 'occupied').length,
      available: tablesList.filter(table => table.status === 'available').length,
      reserved: tablesList.filter(table => table.status === 'reserved').length
    };
    setStats(stats);
  };

  const updateTableStatus = async (tableId, newStatus) => {
    try {
      await axios.put(`http://localhost:4000/api/tables/${tableId}/status`, { status: newStatus });
      fetchTables(); // Refresh tables after status update
    } catch (error) {
      console.error("Failed to update table status:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return '✅';
      case 'occupied':
        return '🔴';
      case 'reserved':
        return '📅';
      case 'maintenance':
        return '🔧';
      default:
        return '❓';
    }
  };

  const getSectionIcon = (section) => {
    switch (section?.toLowerCase()) {
      case 'indoor':
        return '🏠';
      case 'outdoor':
        return '🌳';
      case 'private':
        return '🎭';
      case 'vip':
        return '👑';
      default:
        return '🪑';
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

  const calculateOrderTotal = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  useEffect(() => {
    fetchTables();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchTables, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && tables.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tables...</p>
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
            🪑 Restaurant Tables
          </h1>
          <p className="text-lg text-gray-600">
            Real-time table management and monitoring
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Tables</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">🔴</div>
              <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
              <div className="text-sm text-gray-600">Occupied</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">📅</div>
              <div className="text-2xl font-bold text-blue-600">{stats.reserved}</div>
              <div className="text-sm text-gray-600">Reserved</div>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        {tables.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🪑</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tables found</h3>
            <p className="text-gray-600">Tables will appear here when available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div
                key={table._id}
                className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Table Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getSectionIcon(table.section)}</span>
                      <span className="font-semibold text-gray-900 text-lg">
                        Table {table.tableNumber}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(table.status)}`}>
                      {getStatusIcon(table.status)} {table.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>👥 Capacity: {table.capacity}</span>
                    <span>📍 {table.section.toUpperCase()}</span>
                  </div>
                </div>

                {/* Table Details */}
                <div className="p-4">
                  {/* Features */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="mr-2">⭐</span>
                      Features
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {table.features.hasCharger && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          🔌 Charger
                        </span>
                      )}
                      {table.features.isWheelchairAccessible && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          ♿ Accessible
                        </span>
                      )}
                      {table.features.hasAirConditioner && (
                        <span className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full">
                          ❄️ AC
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Current Order */}
                  {table.currentOrder && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">🍽️</span>
                        Current Order
                      </h4>
                      
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Order Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(table.currentOrder.status.toLowerCase())}`}>
                            {table.currentOrder.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {table.currentOrder.items.map((item, index) => (
                            <div key={item._id || index} className="flex items-center justify-between text-sm">
                              <span>{item.name} × {item.quantity}</span>
                              <span className="font-medium">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t mt-2 pt-2 flex items-center justify-between font-semibold">
                          <span>Total:</span>
                          <span className="text-teal-600">₹{calculateOrderTotal(table.currentOrder.items)}</span>
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                          Ordered: {formatTime(table.currentOrder.createdAt)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Table Metadata */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>📈 Orders Today:</span>
                      <span className="font-medium">{table.metadata.totalOrdersToday}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>⏱️ Avg. Occupancy:</span>
                      <span className="font-medium">{table.metadata.averageOccupancyTime} min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>👥 Current Guests:</span>
                      <span className="font-medium">{table.currentGuests}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex space-x-2">
                    {table.status === 'available' && (
                      <button
                        onClick={() => updateTableStatus(table._id, 'occupied')}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        🔴 Mark Occupied
                      </button>
                    )}
                    
                    {table.status === 'occupied' && (
                      <button
                        onClick={() => updateTableStatus(table._id, 'available')}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        ✅ Mark Available
                      </button>
                    )}

                    {table.status !== 'reserved' && (
                      <button
                        onClick={() => updateTableStatus(table._id, 'reserved')}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        📅 Reserve
                      </button>
                    )}

                    {table.status === 'reserved' && (
                      <button
                        onClick={() => updateTableStatus(table._id, 'available')}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        ✅ Clear Reservation
                      </button>
                    )}
                  </div>
                </div>

                {/* Last Updated */}
                <div className="px-4 pb-4">
                  <div className="text-xs text-gray-500 text-center">
                    Last updated: {formatTime(table.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={fetchTables}
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
                Refresh Tables
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>🔄 Tables auto-refresh every 30 seconds</p>
          <p className="mt-1">Table Management System</p>
        </div>
      </div>
    </div>
  );
}

export default TablesFetch;