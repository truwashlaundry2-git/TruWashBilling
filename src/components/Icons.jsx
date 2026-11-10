export default function Icon({ name, size = 20 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (name === "dashboard") {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
      </svg>
    );
  }
  if (name === "plus") {
    return (
      <svg {...props}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  if (name === "receipt") {
    return (
      <svg {...props}>
        <path d="M7 3.5h10a1 1 0 0 1 1 1V20l-2.2-1.4L13.5 20l-2.3-1.4L9 20l-2.2-1.4L4.5 20V4.5a1 1 0 0 1 1-1H7z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg {...props}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.6-2.6 2.7-4 5.5-4s4.9 1.4 5.5 4" />
        <circle cx="17" cy="9" r="2.2" />
        <path d="M16.2 15c1.8.2 3.2 1.2 3.8 3" />
      </svg>
    );
  }
  if (name === "tag") {
    return (
      <svg {...props}>
        <path d="M3.5 12.5 12 4h7.5v7.5L11 20.5a1.5 1.5 0 0 1-2.1 0L3.5 14.6a1.5 1.5 0 0 1 0-2.1z" />
        <circle cx="16" cy="8" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg {...props}>
        <path d="M4 19h16" />
        <path d="M7 16v-4M12 16V7M17 16v-6" />
      </svg>
    );
  }
  if (name === "gear") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6" />
      </svg>
    );
  }
  if (name === "print") {
    return (
      <svg {...props}>
        <path d="M7 8V3.5h10V8" />
        <path d="M6 17H4.5A1.5 1.5 0 0 1 3 15.5v-5A1.5 1.5 0 0 1 4.5 9h15A1.5 1.5 0 0 1 21 10.5v5a1.5 1.5 0 0 1-1.5 1.5H18" />
        <rect x="7" y="14" width="10" height="6.5" rx="1" />
      </svg>
    );
  }
  return null;
}
