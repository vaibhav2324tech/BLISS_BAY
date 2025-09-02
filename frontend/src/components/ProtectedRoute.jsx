import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center p-6">
          <div className="card">
            {/* Access Denied Header */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🚫</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">
                You don't have permission to access this page.
              </p>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-700">
                <p><strong>Current User:</strong> {user.username}</p>
                <p><strong>Your Role:</strong> <span className="capitalize">{user.role}</span></p>
                <p><strong>Required Roles:</strong> {roles.join(', ')}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="btn-primary w-full"
              >
                ← Go Back
              </button>
              
              <button
                onClick={() => window.location.href = "/"}
                className="btn-outline w-full"
              >
                🏠 Back to Home
              </button>

              {/* Role-specific suggestions */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 font-medium mb-2">
                  💡 Suggested Actions:
                </p>
                {user.role === 'waiter' && (
                  <p className="text-xs text-blue-700">
                    As a waiter, try accessing the Waiter Dashboard or Table Management.
                  </p>
                )}
                {user.role === 'kitchen' && (
                  <p className="text-xs text-blue-700">
                    As kitchen staff, try accessing the Kitchen Operations or Order Management.
                  </p>
                )}
                {user.role === 'cashier' && (
                  <p className="text-xs text-blue-700">
                    As a cashier, try accessing the Billing System or Payment Processing.
                  </p>
                )}
                {user.role === 'manager' && (
                  <p className="text-xs text-blue-700">
                    As a manager, try accessing the Management Dashboard or Reports.
                  </p>
                )}
                {user.role === 'admin' && (
                  <p className="text-xs text-blue-700">
                    As an admin, you should have access to most areas. Contact support if this persists.
                  </p>
                )}
              </div>
            </div>

            {/* Contact Support */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Need different access? Contact your system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has proper access, render the protected content
  return children;
}
