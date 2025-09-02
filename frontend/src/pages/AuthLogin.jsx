import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AuthLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();

  // Get default role from navigation state if passed from landing page
  useState(() => {
    const defaultRole = location.state?.defaultRole;
    if (defaultRole) {
      setRole(defaultRole);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    const result = await login(username, password, role);
    
    if (result.success) {
      // Show success notification
      const event = new CustomEvent('showToast', {
        detail: { 
          message: `Welcome ${username}! Redirecting to ${role} dashboard...`, 
          type: 'success' 
        }
      });
      window.dispatchEvent(event);

      // Navigate based on role
      const roleRoutes = {
        admin: "/admin",
        kitchen: "/kitchen", 
        cashier: "/cashier",
        manager: "/manager",
        waiter: "/waiter",
        superadmin: "/superadmin"
      };
      
      setTimeout(() => {
        navigate(roleRoutes[role] || "/admin");
      }, 1000);
    } else {
      setError(result.message || "Invalid credentials. Please try again.");
    }
  };

  const handleDemoLogin = (demoRole, demoUsername, demoPassword) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setRole(demoRole);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🍽️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🔐 Staff Login</h2>
            <p className="text-gray-600">Access restaurant management systems</p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Level
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
              >
                <option value="admin">👨‍💼 Admin Dashboard</option>
                <option value="kitchen">👨‍🍳 Kitchen Operations</option>
                <option value="cashier">💳 Billing & Payments</option>
                <option value="manager">📊 Management View</option>
                <option value="waiter">🍽️ Waiter Service</option>
                <option value="superadmin">⚡ Super Admin</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full btn-primary ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700 transform hover:scale-[1.02]'
              } transition-all duration-200`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                '🚀 Login & Continue'
              )}
            </button>
          </form>
          
          {/* Demo Credentials Section */}
          <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <h4 className="text-sm font-semibold text-teal-800 mb-3 flex items-center">
              <span className="mr-2">🔧</span>
              Demo Credentials (Click to Use)
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {[
                { role: 'admin', username: 'admin', password: 'admin123', icon: '👨‍💼', label: 'Admin' },
                { role: 'kitchen', username: 'kitchen', password: 'kitchen123', icon: '👨‍🍳', label: 'Kitchen' },
                { role: 'cashier', username: 'cashier', password: 'cashier123', icon: '💳', label: 'Cashier' },
                { role: 'manager', username: 'manager', password: 'manager123', icon: '📊', label: 'Manager' },
                { role: 'waiter', username: 'waiter', password: 'waiter123', icon: '🍽️', label: 'Waiter' }
              ].map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleDemoLogin(demo.role, demo.username, demo.password)}
                  className="text-left p-2 text-xs bg-white border border-teal-200 rounded hover:bg-teal-50 transition-colors duration-200"
                >
                  <span className="font-medium text-teal-700">
                    {demo.icon} {demo.label}:
                  </span>
                  <span className="text-teal-600 ml-2">
                    {demo.username} / {demo.password}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Navigation */}
          <div className="mt-6 space-y-3">
            <button
              onClick={() => navigate("/")}
              className="btn-outline w-full"
            >
              ← Back to Main Menu
            </button>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact your system administrator
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>🔒 Secure staff authentication</p>
          <p className="mt-1">QR Restaurant Management System</p>
        </div>
      </div>
    </div>
  );
}
