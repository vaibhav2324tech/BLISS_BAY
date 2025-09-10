import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRestaurant } from "../contexts/RestaurantContext";
import { useCart } from "../contexts/CartContext";

export default function LandingPage() {
  const [selectedTable, setSelectedTable] = useState("");
  const [tables, setTables] = useState([]);
  const navigate = useNavigate();
  const { tableId } = useParams();
  const { getTables, setCurrentTable } = useRestaurant();
  const { clearCart } = useCart();

  useEffect(() => {
    // Load available tables
    const loadTables = async () => {
      try {
        const tableList = [
          { id: 'T01', name: 'Table 1', type: 'Indoor', seats: 4, status: 'available' },
          { id: 'T02', name: 'Table 2', type: 'Indoor', seats: 2, status: 'available' },
          { id: 'T03', name: 'Table 3', type: 'Outdoor', seats: 6, status: 'available' },
          { id: 'T04', name: 'Table 4', type: 'Indoor', seats: 4, status: 'occupied' },
          { id: 'T05', name: 'Table 5', type: 'Outdoor', seats: 8, status: 'available' },
          { id: 'T06', name: 'Table 6', type: 'Private', seats: 10, status: 'available' },
        ];
        setTables(tableList);
      } catch (error) {
        console.error('Failed to load tables:', error);
      }
    };

    loadTables();

    // If accessed via QR code with tableId
    if (tableId) {
      setSelectedTable(tableId);
    }
  }, [tableId]);

  const handleStartSession = () => {
    if (!selectedTable) {
      alert("⚠️ Please select your table number!");
      return;
    }

    const table = tables.find(t => t.id === selectedTable);
    if (!table) {
      alert("❌ Invalid table selection!");
      return;
    }

    if (table.status === 'occupied') {
      alert("🚫 This table is currently occupied. Please select another table or contact staff.");
      return;
    }

    // Set current table in context
    setCurrentTable(table);
    // Clear any existing cart data
    // clearCart();
    
    // Navigate to menu with table context
    navigate(`/menu?table=${selectedTable}`);
  };

  const handleStaffAccess = (role) => {
    navigate("/login", { state: { defaultRole: role } });
  };

  const availableTables = tables.filter(table => table.status === 'available');

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🍽️ QR Restaurant
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Digital Ordering & Billing System
          </p>
          <p className="text-sm text-gray-500">
            Scan the QR code at your table or select from the list below to start ordering
          </p>
        </div>

        {/* Guest Section */}
        <div className="card">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 Start Your Order</h2>
            <p className="text-gray-600">Select your table to begin digital ordering</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Your Table
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Choose your table...</option>
                {availableTables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name} - {table.type} • {table.seats} seats
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleStartSession}
              disabled={!selectedTable}
              className={`btn-primary w-full ${
                !selectedTable 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-teal-700 transform hover:scale-[1.02]'
              } transition-all duration-200`}
            >
              🚀 Start Digital Ordering
            </button>
          </div>

          {/* Quick QR Info */}
          <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-sm font-semibold text-teal-800">QR Code Access</p>
                <p className="text-xs text-teal-600">
                  Scan the QR code at your table for direct access to your table's menu
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Access Section */}
        <div className="card">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">🔧 Staff Access</h2>
            <p className="text-sm text-gray-600">Login to access management dashboards</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleStaffAccess('admin')}
              className="btn-outline btn-sm text-center"
            >
              👨‍💼 Admin
            </button>
            <button
              onClick={() => handleStaffAccess('kitchen')}
              className="btn-outline btn-sm text-center"
            >
              👨‍🍳 Kitchen
            </button>
            <button
              onClick={() => handleStaffAccess('cashier')}
              className="btn-outline btn-sm text-center"
            >
              💳 Cashier
            </button>
            <button
              onClick={() => handleStaffAccess('manager')}
              className="btn-outline btn-sm text-center"
            >
              📊 Manager
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/login")}
              className="btn-primary btn-sm"
            >
              🔐 Staff Login Portal
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>📍 Modern contactless dining experience</p>
          <p className="mt-1">Powered by QR Restaurant System</p>
        </div>
      </div>
    </div>
  );
}
