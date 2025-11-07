import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import "./../styles/chartNew.css";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export default function BarChartHorizontal({ data }) {
  return (
    <div className="chart-box">
      <h3>Bar Chart</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="label" type="category" width={100} />
          <Tooltip />
          <Bar dataKey="votes" barSize={18}>
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
