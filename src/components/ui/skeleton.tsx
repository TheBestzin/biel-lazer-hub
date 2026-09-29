import { cn } from "@/lib/utils";

/**
 * Skeleton com shimmer (gradiente que atravessa) em vez de pulse
 * binário — leitura mais "cara" e mais suave. Respeita
 * `prefers-reduced-motion` (fica estático, sem animação).
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-primary/10",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:content-['']",
        "motion-reduce:after:animate-none motion-reduce:after:hidden",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
