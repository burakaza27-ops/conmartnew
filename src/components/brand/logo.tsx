import Link from "next/link";

import { cn } from "@/lib/utils";

const SIZE = {
  sm: { mark: "size-7", type: "text-sm", sub: "text-[10px]" },
  md: { mark: "size-9", type: "text-base", sub: "text-[11px]" },
  lg: { mark: "size-11", type: "text-xl", sub: "text-xs" },
} as const;

interface LogoProps {
  href?: string | null;
  size?: keyof typeof SIZE;
  /** Shown under the wordmark. Pass `null` to hide it. */
  subtitle?: string | null;
  className?: string;
}

/**
 * Brand mark used in the marketing header, auth, and every app sidebar.
 *
 * The mark is a pair of structural beams, not a clip-art hard hat: it has to
 * read at 28px on a phone status bar and still look like a product, not a
 * construction-site emoji.
 */
export function Logo({
  href = "/",
  size = "md",
  subtitle = "Ethiopia",
  className,
}: LogoProps) {
  const scale = SIZE[size];

  const inner = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs",
          scale.mark
        )}
      >
        <svg viewBox="0 0 32 32" className="size-[62%]" fill="none">
          <path
            d="M7 24V10.5L16 6l9 4.5V24"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M7 16.5h18"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
            scale.type
          )}
        >
          ECON
        </span>
        {subtitle ? (
          <span
            className={cn(
              "mt-0.5 font-medium tracking-[0.14em] text-muted-foreground uppercase",
              scale.sub
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </>
  );

  const classes = cn("inline-flex items-center gap-2.5", className);

  if (!href) {
    return <span className={classes}>{inner}</span>;
  }

  return (
    <Link href={href} className={cn(classes, "transition-opacity hover:opacity-90")}>
      {inner}
    </Link>
  );
}
