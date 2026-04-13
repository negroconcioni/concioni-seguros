import type { ReactNode } from "react";

type BadgeProps = {
  variant?: "blue" | "green" | "red" | "orange" | "neutral";
  children: ReactNode;
};

const variantClasses = {
  blue: "bg-[#eff4ff] text-[#1d4ed8]",
  green: "bg-[#edf7f1] text-[#2e7d52]",
  red: "bg-[#fdf0ef] text-[#c0392b]",
  orange: "bg-[#eff4ff] text-[#1d4ed8]",
  neutral: "bg-[#eeecea] text-[#6b6860]",
};

function Badge({ variant = "neutral", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}

export default Badge;
