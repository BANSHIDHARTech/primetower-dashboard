interface StatsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'orange';
}

const COLOR_MAP = {
  blue: {
    border: 'border-t-[#003178]',
    text: 'text-[#003178]',
    bg: 'bg-[#003178]/5',
  },
  green: {
    border: 'border-t-[#2E7D32]',
    text: 'text-[#2E7D32]',
    bg: 'bg-[#2E7D32]/5',
  },
  orange: {
    border: 'border-t-[#FB6D00]',
    text: 'text-[#FB6D00]',
    bg: 'bg-[#FB6D00]/5',
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  color = 'blue',
}: StatsCardProps) {
  const c = COLOR_MAP[color];
  const formatted = value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  return (
    <div
      className={`bg-white rounded-2xl border border-[#C3C6D4]/15 ${c.border} border-t-4 p-6 shadow-sm`}
    >
      <p className="text-xs font-bold text-[#434652] tracking-wider uppercase mb-2">
        {title}
      </p>
      <p className={`text-3xl font-extrabold ${c.text} tracking-tight`}>
        {formatted}
      </p>
      {subtitle && (
        <p className="text-xs text-[#737783] mt-2 font-medium">{subtitle}</p>
      )}
    </div>
  );
}
