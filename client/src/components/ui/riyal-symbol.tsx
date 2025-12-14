import { cn } from "@/lib/utils";

interface RiyalSymbolProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export function RiyalSymbol({ className, size = "md" }: RiyalSymbolProps) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      className={cn(sizeClasses[size], "inline-block", className)}
      fill="currentColor"
      aria-label="ريال سعودي"
    >
      <path d="M512 0C229.2 0 0 229.2 0 512s229.2 512 512 512 512-229.2 512-512S794.8 0 512 0zm0 960C264.6 960 64 759.4 64 512S264.6 64 512 64s448 200.6 448 448-200.6 448-448 448z" fillOpacity="0" />
      <path d="M380 280h64v280c0 35.3-28.7 64-64 64h-40v-64h40V280zm184 0h64v280c0 35.3-28.7 64-64 64h-40v-64h40V280zm-184 424h248c17.7 0 32 14.3 32 32s-14.3 32-32 32H380c-17.7 0-32-14.3-32-32s14.3-32 32-32zm248-64h64c17.7 0 32 14.3 32 32v128c0 17.7-14.3 32-32 32H628c-17.7 0-32-14.3-32-32v-96h64v64h32v-64c0-17.7 14.3-32 32-32h64z" fillOpacity="0" />
      <g transform="translate(200, 200) scale(0.6)">
        <path d="M340 100h80v350c0 44.2-35.8 80-80 80H280v-80h60V100z" />
        <path d="M540 100h80v350c0 44.2-35.8 80-80 80H480v-80h60V100z" />
        <path d="M280 580h400c22.1 0 40 17.9 40 40s-17.9 40-40 40H280c-22.1 0-40-17.9-40-40s17.9-40 40-40z" />
        <path d="M280 680h400c22.1 0 40 17.9 40 40s-17.9 40-40 40H280c-22.1 0-40-17.9-40-40s17.9-40 40-40z" />
        <path d="M720 450h80c22.1 0 40 17.9 40 40v200c0 22.1-17.9 40-40 40h-80c-22.1 0-40-17.9-40-40v-40h80v0c0 0 0 0 0 0h0v-120c0-22.1 17.9-40 40-40z" />
      </g>
    </svg>
  );
}

export function formatRiyal(amount: number, showDecimals = false): string {
  const formatted = new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
  return `${formatted} ر.س`;
}

export function formatRiyalEn(amount: number, showDecimals = false): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
  return `${formatted} ر.س`;
}
