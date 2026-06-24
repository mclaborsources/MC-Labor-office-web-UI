import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  priority?: boolean;
  variant?: "default" | "on-dark";
}

const sizes = {
  sm: { className: "h-10 w-auto min-w-[5.5rem]", width: 110, height: 40 },
  md: { className: "h-14 w-auto min-w-[8rem]", width: 160, height: 56 },
  lg: { className: "h-20 w-auto min-w-[11rem]", width: 220, height: 80 },
  xl: { className: "h-24 w-auto min-w-[14rem] sm:h-28 sm:min-w-[16rem]", width: 280, height: 100 },
  hero: {
    className: "h-32 w-auto min-w-[18rem] sm:h-40 sm:min-w-[22rem] lg:h-44 lg:min-w-[24rem]",
    width: 360,
    height: 140,
  },
};

export function Logo({
  size = "sm",
  className = "",
  priority = false,
  variant = "default",
}: LogoProps) {
  const { className: sizeClass, width, height } = sizes[size];

  return (
    <Image
      src="/logo.png"
      alt="MC Labor"
      width={width}
      height={height}
      priority={priority}
      className={`object-contain transition-transform duration-500 ease-out hover:scale-[1.03] ${sizeClass} ${
        variant === "on-dark"
          ? "drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
          : "drop-shadow-[0_8px_32px_rgba(15,23,42,0.12)]"
      } ${className}`}
    />
  );
}
