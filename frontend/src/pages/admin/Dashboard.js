import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const [analytics, setAnalytics] = useState({
    total_revenue: 0,
    total_orders: 0,
    total_customers: 0,
    total_products: 0,
    orders_by_status: [],
    top_products: [],
    sales_over_time: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/analytics");
      console.log("Analytics:", res.data);
      setAnalytics(res.data);
    } catch (err) {
      console.log("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Orders by Status - Pie Chart
  const pieChartData = {
    labels: analytics.orders_by_status.map((s) => s.status),
    datasets: [
      {
        data: analytics.orders_by_status.map((s) => s.count),
        backgroundColor: ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"],
      },
    ],
  };

  // Sales Over Time - Line Chart
  const lineChartData = {
    labels: analytics.sales_over_time.map((s) => s.month),
    datasets: [
      {
        label: "Revenue (₹)",
        data: analytics.sales_over_time.map((s) => s.revenue),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
    ],
  };

  // Top Products - Bar Chart
  const barChartData = {
    labels: analytics.top_products.map((p) => p.pname),
    datasets: [
      {
        label: "Units Sold",
        data: analytics.top_products.map((p) => p.total_sold),
        backgroundColor: "#10b981",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading analytics...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: "24px" }}>Analytics Dashboard</h1>

      {/* Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <Card title="Total Revenue" value={`₹${Number(analytics.total_revenue).toFixed(2)}`} color="#10b981" />
        <Card title="Total Orders" value={analytics.total_orders} color="#3b82f6" />
        <Card title="Total Customers" value={analytics.total_customers} color="#f59e0b" />
        <Card title="Total Products" value={analytics.total_products} color="#8b5cf6" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div style={chartBox}>
          <h3 style={{ marginBottom: 16 }}>Top Selling Products</h3>
          <div style={{ height: "calc(100% - 40px)" }}>
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        <div style={chartBox}>
          <h3 style={{ marginBottom: 16 }}>Orders by Status</h3>
          <div style={{ height: "calc(100% - 40px)" }}>
            <Pie data={pieChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div style={chartBox}>
        <h3 style={{ marginBottom: 16 }}>Revenue Over Time</h3>
        <div style={{ height: "calc(100% - 40px)" }}>
          <Line data={lineChartData} options={chartOptions} />
        </div>
      </div>

      {/* Top Products Table */}
      {analytics.top_products.length > 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            padding: "20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            marginTop: 20,
          }}
        >
          <h3 style={{ marginBottom: 16 }}>Top Selling Products</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: 12 }}>Product</th>
                <th style={{ textAlign: "right", padding: 12 }}>Units Sold</th>
                <th style={{ textAlign: "right", padding: 12 }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.top_products.map((p, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {p.image && (
                        <img
                          src={`http://localhost:8000${p.image}`}
                          alt={p.pname}
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />
                      )}
                      <span style={{ fontWeight: 500 }}>{p.pname}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", padding: 12, fontWeight: 600 }}>
                    {p.total_sold}
                  </td>
                  <td style={{ textAlign: "right", padding: 12, fontWeight: 600, color: "#10b981" }}>
                    ₹{Number(p.revenue).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "10px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>{title}</p>
      <h2 style={{ margin: "12px 0 0", fontSize: 32, color: color }}>{value}</h2>
    </div>
  );
}

const chartBox = {
  background: "#fff",
  borderRadius: "10px",
  padding: "16px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  height: "300px",
};
