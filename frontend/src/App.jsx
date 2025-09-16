import React, { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const API_URL = "http://localhost:3000"; // ถ้า deploy แล้วค่อยเปลี่ยนเป็น URL จริง

export default function App() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const chartRef = useRef(null);

  const fetchData = async () => {
    const [resLatest, resHist] = await Promise.all([
      fetch(`${API_URL}/api/latest`),
      fetch(`${API_URL}/api/history?limit=50`),
    ]);
    const latestData = await resLatest.json();
    const histData = await resHist.json();
    setLatest(latestData);
    setHistory(histData);
    // ถ้าเพิ่งเข้ามา ให้เลือกจุดล่าสุดเป็น default
    if (histData?.length) setSelected(histData[histData.length - 1]);
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, []);

  const labels = history.map((h) => new Date(h.ts).toLocaleTimeString());
  const data = {
    labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: history.map((h) => h.temperature),
        borderColor: "cyan",
        pointBackgroundColor: "cyan",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.25,
        yAxisID: "y1",
      },
      {
        label: "Humidity (%)",
        data: history.map((h) => h.humidity),
        borderColor: "magenta",
        pointBackgroundColor: "magenta",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.25,
        yAxisID: "y2",
      },
    ],
  };

  const handleClick = (evt) => {
    const chart = chartRef.current;
    if (!chart) return;
    // หาจุดที่ใกล้ที่สุดที่ถูกคลิก
    const points = chart.getElementsAtEventForMode(evt.native || evt, "nearest", { intersect: true }, true);
    if (points.length) {
      const index = points[0].index; // index เดียวกันทั้ง 2 datasets
      setSelected(history[index]);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest", intersect: true },
    plugins: {
      legend: { position: "top", labels: { color: "#ddd" } },
      tooltip: {
        callbacks: {
          title: (items) => {
            const i = items[0].dataIndex;
            return new Date(history[i].ts).toLocaleString();
          },
          label: (ctx) => {
            const i = ctx.dataIndex;
            const r = history[i];
            // แสดงทั้งคู่ใน tooltip ไม่ว่าชี้ dataset ไหน
            return [
              `Temp: ${r.temperature?.toFixed?.(1)} °C`,
              `Humidity: ${r.humidity?.toFixed?.(1)} %`,
              `Device: ${r.deviceId || "-"}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#bbb" },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
      y1: {
        position: "left",
        title: { display: true, text: "°C", color: "#bbb" },
        ticks: { color: "#bbb" },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
      y2: {
        position: "right",
        title: { display: true, text: "%", color: "#bbb" },
        ticks: { color: "#bbb" },
        grid: { drawOnChartArea: false },
      },
    },
    onClick: handleClick,
    // ทำให้เคอร์เซอร์เป็น pointer เมื่อชี้โดนจุด
    onHover: (evt, el) => {
      const canvas = (evt.native || evt).target;
      canvas.style.cursor = el.length ? "pointer" : "default";
    },
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 24, background: "#0b1020", minHeight: "100vh" }}>
      <h1 style={{ color: "white", marginBottom: 16 }}>Web Temp Dashboard</h1>

      <section style={{ background: "#0f1830", color: "white", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Latest</h2>
        {latest ? (
          <div>
            <div>Temperature: {latest.temperature?.toFixed?.(1)} °C</div>
            <div>Humidity: {latest.humidity?.toFixed?.(1)} %</div>
            <div>Device: {latest.deviceId || "-"}</div>
            <div>Time: {latest.ts ? new Date(latest.ts).toLocaleString() : "-"}</div>
          </div>
        ) : (
          <div>Waiting for data…</div>
        )}
      </section>

      {selected && (
        <section
          style={{
            background: "linear-gradient(180deg,#101a33,#0e1426)",
            color: "white",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 0 24px rgba(255,0,255,0.18)",
          }}
        >
          <strong>Selected point</strong>
          <div>Time: {new Date(selected.ts).toLocaleString()}</div>
          <div>Temperature: {selected.temperature?.toFixed?.(1)} °C</div>
          <div>Humidity: {selected.humidity?.toFixed?.(1)} %</div>
          <div>Device: {selected.deviceId || "-"}</div>
        </section>
      )}

      <div style={{ background: "#121212", borderRadius: 12, height: 420, padding: 16 }}>
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}
