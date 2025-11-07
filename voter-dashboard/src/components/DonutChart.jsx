import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "./../styles/chartNew.css";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export default function DonutChart({ data }) {
  return (
    <div className="chart-box">
      <h3>Donut Chart</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="votes"
            nameKey="label"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
