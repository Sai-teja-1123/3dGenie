type LogoMarkProps = {
  className?: string;
};

const LogoMark = ({ className = "h-8 w-8" }: LogoMarkProps) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full drop-shadow-[0_0_10px_rgba(56,189,248,0.35)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoCubeGradient" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {/* Top face */}
        <path d="M32 8L52 20L32 32L12 20L32 8Z" stroke="url(#logoCubeGradient)" strokeWidth="3" strokeLinejoin="round" />
        {/* Vertical edges */}
        <path d="M12 20V44" stroke="url(#logoCubeGradient)" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 32V56" stroke="url(#logoCubeGradient)" strokeWidth="3" strokeLinecap="round" />
        <path d="M52 20V44" stroke="url(#logoCubeGradient)" strokeWidth="3" strokeLinecap="round" />
        {/* Bottom face */}
        <path d="M12 44L32 56L52 44" stroke="url(#logoCubeGradient)" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export default LogoMark;
