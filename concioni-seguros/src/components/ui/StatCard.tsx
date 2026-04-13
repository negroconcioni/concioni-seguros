type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  inverted?: boolean;
};

function StatCard({ label, value, sub, inverted = false }: StatCardProps) {
  return (
    <article
      className={`min-w-0 w-full rounded-xl p-4 ${
        inverted ? "bg-[#1d4ed8] text-white" : "border border-[#e2e0db] bg-white text-[#1a1916]"
      }`}
    >
      <p
        className={`text-[11px] uppercase tracking-wider ${
          inverted ? "text-white/85" : "text-[#6b6860]"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-[34px] font-bold tracking-tight">{value}</p>
      {sub ? (
        <p className={`mt-1 text-sm ${inverted ? "text-white/90" : "text-[#6b6860]"}`}>{sub}</p>
      ) : null}
    </article>
  );
}

export default StatCard;
