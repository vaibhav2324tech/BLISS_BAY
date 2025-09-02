import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../api/axios";
import socket from "../utils/socket";

export default function CashierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [stats, setStats] = useState({
    openBills: 0,
    todayRevenue: 0,
    avgBillValue: 0,
    paymentsMade: 0
  });

  useEffect(() => {
    fetchOpenBills();
    fetchDailyStats();
    
    // Real-time bill updates
    socket.on("bill:new", handleNewBill);
    socket.on("bill:update", handleBillUpdate);
    socket.on("payment:completed", handlePaymentCompleted);
    
    return () => {
      socket.off("bill:new");
      socket.off("bill:update");
      socket.off("payment:completed");
    };
  }, []);

  const fetchOpenBills = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/orders", {
        params: {
          status: "ready,served",
          sortBy: "createdAt",
          order: "desc"
        }
      });
      
      if (res.data.success) {
        setBills(res.data.data);
      } else {
        // Demo data for development
        const demoBills = [
          {
            _id: "bill1",
            tableNumber: "T01",
            status: "ready",
            createdAt: new Date(),
            items: [
              { _id: "1", menuItem: { name: "Margherita Pizza", price: 650 }, quantity: 2 },
              { _id: "2", menuItem: { name: "Caesar Salad", price: 450 }, quantity: 1 }
            ],
            total: 1750
          },
          {
            _id: "bill2",
            tableNumber: "T05",
            status: "served",
            createdAt: new Date(Date.now() - 30 * 60000),
            items: [
              { _id: "3", menuItem: { name: "Grilled Chicken", price: 750 }, quantity: 1 }
            ],
            total: 882
          }
        ];
        setBills(demoBills);
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const res = await axios.get("/analytics/daily-cashier-stats");
      if (res.data.success) {
        setStats(res.data.data);
      } else {
        setStats({
          openBills: 8,
          todayRevenue: 12450,
          avgBillValue: 850,
          paymentsMade: 24
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleNewBill = (bill) => {
    setBills(prev => [bill, ...prev]);
    // Show notification
    const event = new CustomEvent('showToast', {
      detail: { message: `New bill ready for Table ${bill.tableNumber}!`, type: 'info' }
    });
    window.dispatchEvent(event);
  };

  const handleBillUpdate = (updatedBill) => {
    setBills(prev => prev.map(b => b._id === updatedBill._id ? updatedBill : b));
  };

  const handlePaymentCompleted = (billId) => {
    setBills(prev => prev.filter(b => b._id !== billId));
    fetchDailyStats(); // Refresh stats
  };

  const processBillPayment = async () => {
    if (!selectedBill) return;

    try {
      setLoading(true);
      const res = await axios.post(`/orders/${selectedBill._id}/payment`, {
        paymentMethod,
        amount: selectedBill.total,
        processedBy: user.username
      });

      if (res.data.success) {
        // Remove from bills list
        setBills(prev => prev.filter(b => b._id !== selectedBill._id));
        
        // Show success notification
        const event = new CustomEvent('showToast', {
          detail: { 
            message: `Payment processed successfully for Table ${selectedBill.tableNumber}!`, 
            type: 'success' 
          }
        });
        window.dispatchEvent(event);
        
        setShowPaymentModal(false);
        setSelectedBill(null);
        fetchDailyStats(); // Refresh stats
      } else {
        throw new Error(res.data.message || "Payment processing failed");
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      const event = new CustomEvent('showToast', {
        detail: { message: "Failed to process payment. Please try again.", type: 'error' }
      });
      window.dispatchEvent(event);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const calculateBillTotal = (bill) => {
    const subtotal = bill.items?.reduce((sum, item) => 
      sum + (item.menuItem?.price || 0) * item.quantity, 0) || 0;
    const serviceCharge = subtotal * 0.1;
    const gst = subtotal * 0.18;
    return subtotal + serviceCharge + gst;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      case 'served': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'paid': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getBillAge = (createdAt) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt)) / 60000);
    return minutes;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  💳 Cashier Dashboard
                </h2>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.username} • Billing & Payments
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchOpenBills}
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
            <div className="text-3xl text-orange-600 mb-2">📋</div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.openBills}</h3>
            <p className="text-gray-600">Open Bills</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl text-green-600 mb-2">💰</div>
            <h3 className="text-2xl font-bold text-gray-900">₹{stats.todayRevenue?.toLocaleString()}</h3>
            <p className="text-gray-600">Today's Revenue</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl text-blue-600 mb-2">💵</div>
            <h3 className="text-2xl font-bold text-gray-900">₹{stats.avgBillValue}</h3>
            <p className="text-gray-600">Avg Bill Value</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl text-teal-600 mb-2">✅</div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.paymentsMade}</h3>
            <p className="text-gray-600">Payments Made</p>
          </div>
        </div>

        {/* Open Bills Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Open Bills</h3>
            <div className="text-sm text-gray-500">
              {bills.length} bills awaiting payment
            </div>
          </div>

          {loading && bills.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading bills...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">All payments complete!</h3>
              <p className="text-gray-500">No outstanding bills at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {bills.map((bill) => (
                <div key={bill._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Bill Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">Table {bill.tableNumber}</h3>
                        <p className="text-xs text-gray-500">
                          Bill: #{bill._id.slice(-6)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bill.status)}`}>
                          {bill.status.toUpperCase()}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {getBillAge(bill.createdAt)}m ago
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bill Items */}
                  <div className="p-4">
                    <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                      {bill.items?.map((item) => (
                        <div key={item._id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">
                            {item.menuItem?.name || 'Item'} × {item.quantity}
                          </span>
                          <span className="font-medium text-gray-900">
                            ₹{((item.menuItem?.price || 0) * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Bill Total */}
                    <div className="border-t border-gray-200 pt-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total Amount</span>
                        <span className="text-xl font-bold text-green-600">
                          ₹{calculateBillTotal(bill).toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/bill`, { state: { orderId: bill._id, tableNumber: bill.tableNumber } })}
                        className="flex-1 btn-outline btn-sm"
                      >
                        👁️ View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBill(bill);
                          setShowPaymentModal(true);
                        }}
                        className="flex-1 btn-primary btn-sm"
                      >
                        💳 Process Payment
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Processing Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">💳 Process Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBill(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Bill Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Table {selectedBill.tableNumber}</span>
                <span className="text-sm text-gray-500">#{selectedBill._id.slice(-6)}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 text-center">
                ₹{calculateBillTotal(selectedBill).toFixed(2)}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method
              </label>
              <div className="space-y-2">
                {[
                  { id: 'cash', name: '💵 Cash Payment', icon: '💵' },
                  { id: 'card', name: '💳 Card Payment', icon: '💳' },
                  { id: 'upi', name: '📱 UPI Payment', icon: '📱' },
                  { id: 'wallet', name: '👛 Digital Wallet', icon: '👛' }
                ].map((method) => (
                  <label key={method.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-lg mr-2">{method.icon}</span>
                    <span>{method.name.replace(method.icon + ' ', '')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBill(null);
                }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={processBillPayment}
                disabled={loading}
                className={`btn-primary flex-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  '✨ Process Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
