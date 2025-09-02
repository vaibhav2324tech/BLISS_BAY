import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "../api/axios";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "waiter", firstName: "", lastName: "" });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/users", { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/users", newUser, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        fetchUsers();
        setNewUser({ username: "", password: "", role: "waiter", firstName: "", lastName: "" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-100 min-h-screen">
        <h2 className="text-xl font-bold mb-4">📊 Admin Dashboard</h2>

        {/* Add User Form */}
        <form onSubmit={addUser} className="bg-white p-4 rounded shadow mb-6">
          <h3 className="font-bold mb-2">➕ Add New Staff (Non-Admin)</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="First Name" value={newUser.firstName}
              onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
              className="border p-2 rounded" required />

            <input type="text" placeholder="Last Name" value={newUser.lastName}
              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
              className="border p-2 rounded" required />

            <input type="text" placeholder="Username" value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="border p-2 rounded" required />

            <input type="password" placeholder="Password" value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="border p-2 rounded" required />

            <select value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="border p-2 rounded col-span-2">
              <option value="waiter">Waiter</option>
              <option value="kitchen">Kitchen</option>
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <button type="submit" className="mt-4 bg-green-500 text-white px-4 py-2 rounded">Add Staff</button>
        </form>

        {/* Staff List */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">👥 Staff List</h3>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Username</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="text-center">
                  <td className="p-2 border">{u.firstName} {u.lastName}</td>
                  <td className="p-2 border">{u.username}</td>
                  <td className="p-2 border capitalize">{u.role}</td>
                  <td className="p-2 border">
                    <button onClick={() => deleteUser(u._id)} className="bg-red-500 text-white px-3 py-1 rounded">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
