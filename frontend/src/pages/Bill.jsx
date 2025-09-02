import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useRestaurant } from "../contexts/RestaurantContext";
import { useCart } from "../contexts/CartContext";
import axios from "../api/axios";
import socket from "../utils/socket";

export default function Bill() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, tableNumber } = location.state || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [splitBillOptions, setSplitBillOptions] = useState(false);

  const { currentTable } = useRestaurant();
  const { clearCart } = useCart();

  useEffect(() => {
    if (!orderId) {
      navigate("/");
      return;
    }

    const fetchBill = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/orders/${orderId}`);
        if (res.data.success) {
          setOrder(res.data.data);
        } else {
          alert("Failed to fetch bill details.");
          navigate("/");
        }
      } catch (err) {
        console.error("Bill fetch failed:", err);
        alert("Error loading bill. Please try again.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchBill();

    // Real-time order updates via socket
    socket.on("order:update", (updatedOrder) => {
      if (updatedOrder._id === orderId) {
        setOrder(updatedOrder);
      }
    });

    return () => {
      socket.off("order:update");
    };
  }, [orderId, navigate]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`/orders/${orderId}/payment`, {
        paymentMethod,
        amount: grandTotal
      });

      if (res.data.success) {
        // Show success notification
        const event = new CustomEvent('showToast', {
          detail: { 
            message: `Payment successful! Thank you for dining with us.`, 
            type: 'success' 
          }
        });
        window.dispatchEvent(event);
        
        clearCart();
        setTimeout(() => navigate("/"), 2000);
      } else {
        alert("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment processing failed. Please contact staff.");
    } finally {
      setLoading(false);
      setShowPaymentModal(false);
    }
  };

  const handleSplitBill = () => {
    setSplitBillOptions(true);
    // Show success notification
    const event = new CustomEvent('showToast', {
      detail: { 
        message: `Split bill request sent to staff. They will assist you shortly.`, 
        type: 'info' 
      }
    });
    window.dispatchEvent(event);
  };

  const handlePrintBill = () => {
    window.print();
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bill...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const subtotal = order.items?.reduce((sum, item) => 
    sum + (item.menuItem?.price || 0) * item.quantity, 0) || 0;
  const serviceCharge = subtotal * 0.1;
  const gst = subtotal * 0.18;
  const discount = order.discount || 0;
  const grandTotal = subtotal + serviceCharge + gst - discount;

  const currentTableInfo = currentTable || { 
    id: tableNumber, 
    name: `Table ${tableNumber}`, 
    type: 'Indoor', 
    seats: 4 
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/menu")}
                className="btn-outline btn-sm"
              >
                ← Back to Menu
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  📄 Running Bill
                </h2>
                <p className="text-sm text-gray-600">
                  {currentTableInfo.name} • {currentTableInfo.type}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSplitBill}
                className="btn-outline btn-sm"
              >
                ✂️ Split Bill
              </button>
              <button
                onClick={handlePrintBill}
                className="btn-outline btn-sm hidden sm:flex"
              >
                🖨️ Print
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary btn-sm"
                disabled={order.status === 'paid'}
              >
                💳 {order.status === 'paid' ? 'Paid' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Restaurant Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">🍽️ QR Restaurant</h1>
            <p className="text-gray-600">Digital Ordering & Billing System</p>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <div>
              <p><strong>Bill No:</strong> #{order._id?.slice(-8)}</p>
              <p><strong>Table:</strong> {order.tableNumber || tableNumber}</p>
              <p><strong>Date:</strong> {formatDateTime(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <p><strong>Status:</strong></p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status?.toUpperCase() || 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
          
          <div className="space-y-3">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {item.menuItem?.name || 'Menu Item'}
                  </h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Qty: {item.quantity}</span>
                    <span className="mx-2">•</span>
                    <span>₹{item.menuItem?.price || 0} each</span>
                  </div>
                  {item.specialInstructions && (
                    <p className="text-xs text-gray-500 italic mt-1">
                      Note: {item.specialInstructions}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ₹{((item.menuItem?.price || 0) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Food Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Service Charge (10%)</span>
              <span>₹{serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>GST (18%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount Applied</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {order.status !== 'paid' && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary w-full"
              >
                💳 Process Payment
              </button>
              <button
                onClick={() => navigate("/menu")}
                className="btn-outline w-full"
              >
                🍽️ Order More Items
              </button>
            </div>
          )}

          {order.status === 'paid' && (
            <div className="mt-6 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✅ Payment Completed</p>
                <p className="text-green-600 text-sm">Thank you for dining with us!</p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="btn-primary mt-4"
              >
                🏠 Back to Home
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">💳 Process Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-2xl font-bold text-center text-gray-900">
                ₹{grandTotal.toFixed(2)}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="space-y-2">
                {[
                  { id: 'cash', name: '💵 Cash Payment' },
                  { id: 'card', name: '💳 Card Payment' },
                  { id: 'upi', name: '📱 UPI Payment' },
                  { id: 'wallet', name: '👛 Digital Wallet' }
                ].map((method) => (
                  <label key={method.id} className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-2"
                    />
                    <span>{method.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className={`btn-primary flex-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : '✨ Process Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
