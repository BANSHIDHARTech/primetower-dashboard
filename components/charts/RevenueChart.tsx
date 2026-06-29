'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChartData {
  month: string;
  expected: number;
  actual: number;
}

export function RevenueChart({ data }: { data: ChartData[] }) {
  const formatY = (v: number) => `₹${Math.round(v / 100000)}L`;
  const formatTooltip = (v: number) =>
    v.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

  return (
    <div className="bg-white rounded-2xl border border-[#C3C6D4]/15 p-6">
      <h3 className="text-sm font-bold text-[#1E1C0D] mb-4 tracking-tight">
        Revenue Overview
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E9E2CB" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#737783', fontWeight: 600 }}
          />
          <YAxis
            tickFormatter={formatY}
            tick={{ fontSize: 11, fill: '#737783', fontWeight: 600 }}
          />
          <Tooltip
            formatter={(value: any) => formatTooltip(value as number)}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #C3C6D4',
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
          />
          <Bar
            dataKey="expected"
            name="Expected"
            fill="#93c5fd"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="actual"
            name="Actual"
            fill="#003178"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
