import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StaffPerformanceChart({ orders, staff }) {
  if (!orders || !staff) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">👨‍🍳 Staff Performance</h3>
        <p>No data available</p>
      </div>
    );
  }

  const staffPerformance = {};

  orders.forEach((order) => {
    if (order.waiter) {
      const name = order.waiter.username || "Unknown";
      staffPerformance[name] = (staffPerformance[name] || 0) + 1;
    }
  });

  const data = Object.keys(staffPerformance).map((name) => ({
    name,
    orders: staffPerformance[name],
  }));

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">👨‍🍳 Staff Performance</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="orders" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
