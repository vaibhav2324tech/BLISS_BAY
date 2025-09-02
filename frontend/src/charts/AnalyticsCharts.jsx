import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsCharts({ orders }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">📊 Analytics</h3>
        <p>No order data available</p>
      </div>
    );
  }

  // Revenue by day
  const dailyRevenue = orders.reduce((acc, order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + order.total;
    return acc;
  }, {});

  const revenueData = Object.keys(dailyRevenue).map((date) => ({
    date,
    revenue: dailyRevenue[date],
  }));

  // Popular items
  const itemCounts = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const name = item.menuItem?.name || "Unknown";
      itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
    });
  });

  const popularItems = Object.keys(itemCounts).map((name) => ({
    name,
    count: itemCounts[name],
  }));

  return (
    <div className="space-y-6">
      {/* Revenue Trend */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">📈 Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Popular Items */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">🍕 Popular Items</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={popularItems}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
