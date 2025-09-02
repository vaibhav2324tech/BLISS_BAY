import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthLogin from "./pages/AuthLogin";
import GuestMenu from "./pages/GuestMenu";
import Cart from "./pages/Cart";
import Bill from "./pages/Bill";
import WaiterDashboard from "./pages/WaiterDashboard";
import KitchenDashboard from "./pages/KitchenDashboard";
import CashierDashboard from "./pages/CashierDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

// Global components
import LoadingOverlay from "./components/LoadingOverlay";
import ToastContainer from "./components/ToastContainer";
import ItemModal from "./components/ItemModal";
import PaymentModal from "./components/PaymentModal";

// Hooks
import { useAuth } from "./contexts/AuthContext";
import { useRestaurant } from "./contexts/RestaurantContext";

export default function App() {
  const { loading } = useAuth();
  const { isLoading } = useRestaurant();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Routes>
        {/* Landing Page - QR Code Entry Point */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Table-specific menu access */}
        <Route path="/table/:tableId" element={<GuestMenu />} />

        {/* Staff Login */}
        <Route path="/login" element={<AuthLogin />} />

        {/* Guest Flow */}
        <Route path="/menu" element={<GuestMenu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/bill" element={<Bill />} />
        <Route path="/bill/:tableId" element={<Bill />} />

        {/* Waiter Dashboard */}
        <Route
          path="/waiter"
          element={
            <ProtectedRoute roles={["waiter", "admin", "superadmin"]}>
              <WaiterDashboard />
            </ProtectedRoute>
          }
        />

        {/* Kitchen Dashboard */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute roles={["kitchen", "admin", "superadmin"]}>
              <KitchenDashboard />
            </ProtectedRoute>
          }
        />

        {/* Cashier Dashboard */}
        <Route
          path="/cashier"
          element={
            <ProtectedRoute roles={["cashier", "admin", "superadmin"]}>
              <CashierDashboard />
            </ProtectedRoute>
          }
        />

        {/* Manager Dashboard */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute roles={["manager", "admin", "superadmin"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin", "superadmin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* SuperAdmin Dashboard */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute roles={["superadmin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all route - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Components */}
      <ItemModal />
      <PaymentModal />
      <LoadingOverlay show={loading || isLoading} />
      <ToastContainer />
    </div>
  );
}
