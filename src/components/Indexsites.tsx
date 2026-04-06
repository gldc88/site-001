import React from "react";

type Site = { label: string; file: string };

export default function IndexSites({
  sites,
  toRoute,
}: {
  sites: readonly Site[];
  toRoute: (file: string) => string;
}) {
  return (
    <div className="flex flex-col gap-[10px]">
      {sites.map((s, i) => {
        const marker = String(i + 1).padStart(2, "0");
        const href = toRoute(s.file);

        return (
          <a
            key={s.label}
            href={href}
            aria-label={s.label}
            className={[
              "group flex items-start gap-[12px] rounded-[14px] border border-[rgba(201,161,95,.12)]",
              "bg-[rgba(0,0,0,.18)] px-[16px] py-[16px] transition",
              "hover:-translate-y-[1px] hover:border-[rgba(201,161,95,.22)] hover:bg-[rgba(201,161,95,.04)]",
              "hover:shadow-[0_0_0_1px_rgba(201,161,95,.10)_inset,0_24px_70px_rgba(0,0,0,.55)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,161,95,.55)] focus-visible:ring-offset-4 focus-visible:ring-offset-[#050506]",
            ].join(" ")}
          >
            <div
              aria-hidden="true"
              className={[
                "flex h-[40px] w-[40px] flex-none items-center justify-center rounded-[12px] border border-[rgba(201,161,95,.18)]",
                "text-[12px] tracking-[.08em] text-[rgba(201,161,95,.80)] font-gl-serif",
                "bg-[linear-gradient(180deg,rgba(255,255,255,.02),rgba(0,0,0,.55))]",
                "[background-image:radial-gradient(24px_24px_at_30%_30%,rgba(201,161,95,.22),transparent_62%),linear-gradient(180deg,rgba(255,255,255,.02),rgba(0,0,0,.55))]",
              ].join(" ")}
            >
              {marker}
            </div>

            <div className="min-w-0 pt-[2px]">
              <h2 className="m-0 font-gl-serif text-[20px] font-semibold tracking-[.02em] text-[rgba(201,161,95,.92)]">
                {s.label}
              </h2>
            </div>
          </a>
        );
      })}
    </div>
  );
}
