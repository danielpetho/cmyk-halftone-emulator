import { useState } from "react";

const FigmaLogo = () => (
  <svg
    width="16"
    height="24"
    viewBox="0 247 700 360"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M247.5 402.5C247.5 374.195 270.445 351.25 298.75 351.25H350V402.5C350 430.805 327.055 453.75 298.75 453.75C270.445 453.75 247.5 430.805 247.5 402.5Z"
      fill="#0ACF83"
    />
    <path
      d="M350 300C350 271.696 372.945 248.75 401.25 248.75C429.554 248.75 452.5 271.695 452.5 300C452.5 328.305 429.554 351.25 401.25 351.25C372.945 351.25 350 328.304 350 300Z"
      fill="#1ABCFE"
    />
    <path
      d="M247.5 300C247.5 328.305 270.445 351.25 298.75 351.25H350V248.75H298.75C270.445 248.75 247.5 271.695 247.5 300Z"
      fill="#A259FF"
    />
    <path
      d="M350 146.25V248.75H401.25C429.555 248.75 452.5 225.805 452.5 197.5C452.5 169.195 429.555 146.25 401.25 146.25H350Z"
      fill="#FF7262"
    />
    <path
      d="M247.5 197.5C247.5 225.805 270.445 248.75 298.75 248.75H350V146.25H298.75C270.445 146.25 247.5 169.195 247.5 197.5Z"
      fill="#F24E1E"
    />
  </svg>
);

export function FigmaPluginBanner() {
  const [isHovered, setIsHovered] = useState(false);
  const pluginUrl = "https://www.figma.com/community/plugin/1584204863720680047/cmyk-halftone";

  return (
    <a
      href={pluginUrl}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        backgroundColor: isHovered ? "#1a1a1a" : "#000",
        padding: "6px 16px",
        color: "#fff",
        fontSize: "13px",
        fontWeight: 500,
        textDecoration: "none",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
      }}
    >
      <FigmaLogo />
      <span>Try the Figma Plugin</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, opacity: 0.6, transform: "translateY(-1px)" }}
      >
        <path d="M7 17L17 7" />
        <path d="M7 7h10v10" />
      </svg>
    </a>
  );
}
