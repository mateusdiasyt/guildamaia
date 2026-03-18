import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Image
        src="/logo-maia.png"
        alt="Logo Maia"
        width={960}
        height={320}
        className="h-auto w-full object-contain"
        priority={priority}
      />
    </div>
  );
}
