import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "../api/axios";
import { useCart } from "../contexts/CartContext";


export default function Cart() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cart, setCart] = useState(location.state?.cart || []);
  const tableNumber = location.state?.tableNumber || "unknown";
  const {clearCart} = useCart();

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const gst = total * 0.18;
  const serviceCharge = total * 0.1;
  const grandTotal = total + gst + serviceCharge;

  const placeOrder = async () => {
    try {
      console.log(tableNumber,"and",cart,"and" , grandTotal)
      const res = await axios.post("/orders", {
        tableNumber,
        items: cart.map((item) => ({
          menuItem: item._id,
          quantity: item.qty,
        })),
        total: grandTotal,
      });



      if (res.data.success) {
        alert(`✅ Order placed for Table ${tableNumber}`);
        localStorage.setItem("orderId",res.data.data._id);
        clearCart();  
        navigate("/bill", { state: { orderId: res.data.data._id, tableNumber } });
      }
    } catch (err) {
      console.error("Order error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white p-4 text-center text-xl font-bold">
        🛒 Cart (Table {tableNumber})
      </header>

      <main className="flex-1 p-4 space-y-4">
        {cart.map((item) => (
          <div key={item._id} className="bg-white p-4 rounded shadow flex justify-between">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p>Qty: {item.qty}</p>
            </div>
            <p className="font-bold">₹{item.qty * item.price}</p>
          </div>
        ))}

        <div className="bg-white p-4 rounded shadow">
          <p>Subtotal: ₹{total.toFixed(2)}</p>
          <p>GST (18%): ₹{gst.toFixed(2)}</p>
          <p>Service (10%): ₹{serviceCharge.toFixed(2)}</p>
          <h3 className="font-bold mt-2">Total: ₹{grandTotal.toFixed(2)}</h3>
        </div>
      </main>

      <footer className="bg-gray-200 p-4 text-center space-x-2">
        <button
          onClick={placeOrder}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Place Order ✅
        </button>
        <Link to="/menu" className="bg-gray-500 text-white px-4 py-2 rounded">
          Back to Menu
        </Link>
      </footer>
    </div>
  );
}
