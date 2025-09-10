import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AdminDashboard() {
  return (
    <div className="flex">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Scrollable Content */}
      <div className="flex-1 ml-60 p-6 bg-gray-100 min-h-screen overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
