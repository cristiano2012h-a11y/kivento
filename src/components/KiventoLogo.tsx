import React from 'react';

interface KiventoLogoProps {
  className?: string;
  showTagline?: boolean;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export const KiventoIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-transform duration-500 hover:rotate-45`}
      id="kivento-icon-svg"
    >
      <defs>
        {/* Navy Gradient for wind curves */}
        <linearGradient id="navy-grad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#121b2d" />
        </linearGradient>
        {/* Gold/Bronze Gradient for circular wind curves */}
        <linearGradient id="gold-grad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c5a484" />
          <stop offset="50%" stopColor="#aa835c" />
          <stop offset="100%" stopColor="#8c653f" />
        </linearGradient>
        <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
        </filter>
      </defs>

      {/* Main Outer Circular Structure (Gold curves) */}
      {/* Upper-right gold half ring */}
      <path
        d="M 100 15 C 145 15, 185 55, 185 100 C 185 115, 181 128, 174 140"
        stroke="url(#gold-grad)"
        strokeWidth="7"
        strokeLinecap="round"
        filter="url(#subtle-shadow)"
      />
      {/* Lower-left gold half ring */}
      <path
        d="M 100 185 C 55 185, 15 145, 15 100 C 15 90, 17 80, 21 72"
        stroke="url(#gold-grad)"
        strokeWidth="7"
        strokeLinecap="round"
        filter="url(#subtle-shadow)"
      />

      {/* Interweaving Wind Currents */}
      {/* Central Upper Gold Current swooping left to right */}
      <path
        d="M 45 80 C 85 80, 95 50, 125 50 C 155 50, 175 75, 195 90"
        stroke="url(#gold-grad)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Central Middle Wind Swirl (Gold) */}
      <path
        d="M 90 75 C 115 75, 130 85, 130 95 C 130 105, 115 112, 100 112 C 80 112, 85 95, 100 95 C 110 95, 115 100, 110 105"
        stroke="url(#gold-grad)"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Central Lower Navy Current swooping right to left (The "Vento" contrast) */}
      <path
        d="M 155 120 C 115 120, 105 150, 75 150 C 45 150, 25 125, 5 110"
        stroke="url(#navy-grad)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        filter="url(#subtle-shadow)"
      />

      {/* Internal accent curves (representing wind flows) */}
      <path
        d="M 35 118 C 55 140, 85 170, 120 170 C 150 170, 168 152, 180 135"
        stroke="url(#navy-grad)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      
      <path
        d="M 165 82 C 145 60, 115 30, 80 30 C 50 30, 32 48, 20 65"
        stroke="url(#gold-grad)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

export const KiventoLogo: React.FC<KiventoLogoProps> = ({
  className = '',
  showTagline = true,
  layout = 'horizontal',
  size = 'md'
}) => {
  const iconSize = size === 'sm' ? 36 : size === 'md' ? 52 : 72;
  const titleSize = size === 'sm' ? 'text-xl' : size === 'md' ? 'text-3xl' : 'text-5xl';
  const tagSize = size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[11px]' : 'text-sm';
  
  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`} id="kivento-logo-vertical">
        <KiventoIcon size={iconSize} className="mb-3" />
        <div className="flex flex-col items-center">
          <span className={`${titleSize} font-black tracking-[0.18em] text-[#121b2d] leading-none select-none font-sans`}>
            KIVENTO
          </span>
          {showTagline && (
            <span className={`${tagSize} font-bold tracking-[0.25em] text-[#aa835c] mt-2 uppercase select-none`}>
              O vento a favor de suas compras
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3.5 text-left ${className}`} id="kivento-logo-horizontal">
      <KiventoIcon size={iconSize} className="shrink-0" />
      <div className="flex flex-col justify-center">
        <span className={`${titleSize} font-black tracking-[0.15em] text-[#121b2d] leading-none select-none font-sans`}>
          KIVENTO
        </span>
        {showTagline && (
          <span className={`${tagSize} font-bold tracking-[0.16em] text-[#aa835c] mt-1.5 uppercase select-none whitespace-nowrap`}>
            O vento a favor de suas compras
          </span>
        )}
      </div>
    </div>
  );
};
