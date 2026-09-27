type Props = { className?: string };

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const IconeCalendario = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const IconeContas = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" />
    <path d="M4 10h16M15 14.5h2" />
  </svg>
);

export const IconeClientes = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 20v-1.5A3.5 3.5 0 0 1 7.5 15h9a3.5 3.5 0 0 1 3.5 3.5V20" />
    <circle cx="12" cy="8" r="3.5" />
  </svg>
);

export const IconeEquipa = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9.5" r="2.5" />
    <path d="M3 19v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1M15 15.5h1.5a3.5 3.5 0 0 1 3.5 3.5v0" />
  </svg>
);

export const IconeMais = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2.2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconeSair = ({ className }: Props) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10M15 8l4 4-4 4M19 12H9" />
  </svg>
);
