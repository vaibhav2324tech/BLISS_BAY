import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="fixed top-0 left-0 w-60 h-screen bg-gray-800 text-white p-4">
      <h2 className="text-lg font-bold mb-6">🍽 Bliss Bay</h2>

      <nav className="space-y-2">
        <Link to="/" className="block hover:bg-gray-700 p-2 rounded">
          🏠 Landing
        </Link>

        {user?.role === "guest" && (
          <>
            <Link to="/menu" className="block hover:bg-gray-700 p-2 rounded">
              📋 Menu
            </Link>
            <Link to="/cart" className="block hover:bg-gray-700 p-2 rounded">
              🛒 Cart
            </Link>
            <Link to="/bill" className="block hover:bg-gray-700 p-2 rounded">
              💰 Bill
            </Link>
          </>
        )}

        {user?.role === "waiter" && (
          <Link to="/waiter" className="block hover:bg-gray-700 p-2 rounded">
            🍽 Waiter Dashboard
          </Link>
        )}

        {user?.role === "kitchen" && (
          <Link to="/kitchen" className="block hover:bg-gray-700 p-2 rounded">
            👨‍🍳 Kitchen Dashboard
          </Link>
        )}

        {user?.role === "cashier" && (
          <Link to="/cashier" className="block hover:bg-gray-700 p-2 rounded">
            💵 Cashier Dashboard
          </Link>
        )}

        {user?.role === "manager" && (
          <Link to="/manager" className="block hover:bg-gray-700 p-2 rounded">
            📑 Manager Dashboard
          </Link>
        )}

        {user?.role === "admin" && (
          <>
            <Link to="/admin" className="block hover:bg-gray-700 p-2 rounded">
              📊 Admin Dashboard
            </Link>
            <Link to="/admin/orders" className="block hover:bg-gray-700 p-2 rounded">
              📦 Orders
            </Link>
            <Link to="/admin/get-all-tables" className="block hover:bg-gray-700 p-2 rounded">
              📦 Orders
            </Link>
            <Link to="/admin/add-tables" className="block hover:bg-gray-700 p-2 rounded">
              🪑 Add Tables
            </Link>
          </>
        )}

        {user?.role === "superadmin" && (
          <Link to="/superadmin" className="block hover:bg-gray-700 p-2 rounded">
            👑 SuperAdmin Dashboard
          </Link>
        )}
      </nav>

      {user && (
        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 p-2 rounded"
        >
          🚪 Logout
        </button>
      )}
    </div>
  );
}
