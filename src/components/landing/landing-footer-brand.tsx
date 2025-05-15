"use client";

export function BrandLogo() {
  return (
    <span className="font-bold text-lg brand-text-new">
      <span className="market">Market</span><span className="sage">Sage</span>
      <style jsx global>{`
        .brand-text-new .market {
          color: #2DD4BF; /* Exact teal color requested */
          text-shadow: 0 0 8px rgba(45, 212, 191, 0.3);
        }
        .brand-text-new .sage {
          color: #FBBF24; /* Exact amber color requested */
          text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
        }
      `}</style>
    </span>
  );
} 