import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "danger-ghost";
type ButtonSize = "default" | "sm" | "icon";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#1d4ed8] text-white hover:bg-[#1a44c2]",
  outline:
    "border border-[#d0cdc7] bg-white text-[#6b6860] hover:bg-[#f5f4f1] hover:text-[#1a1916]",
  "danger-ghost": "border border-red-200 text-[#c0392b] hover:bg-red-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-sm",
  icon: "h-9 w-9 p-0 text-sm",
};

function Button({
  variant = "primary",
  size = "default",
  onClick,
  children,
  disabled = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`cursor-pointer rounded-lg font-sans font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/[0.08] disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
