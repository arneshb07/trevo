import React from 'react';

interface HeaderProps {
  onResetToBaseline: () => void;
  title?: string;
  subtitle?: string;
  showTitleGroup?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onResetToBaseline,
  title = 'Working Capital',
  subtitle = 'Real-time overview of deployed capital and liquidity.',
  showTitleGroup = true,
}) => {
  return (
    <header className="app-header">
      {/* Clickable Trevo Wordmark Logo */}
      <button
        onClick={onResetToBaseline}
        className="trevo-logo-btn"
        title="Return to baseline Overview"
        aria-label="Trevo home and baseline reset"
      >
        <svg
          width="96"
          height="38"
          viewBox="0 0 140 54"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Handcrafted fluid Trevo script logo matching design */}
          <path
            d="M20 14V34C20 38 23 41 27 41C31 41 33 39 34 37"
            stroke="#0F382A"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M13 22H27"
            stroke="#0F382A"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M39 23V40"
            stroke="#0F382A"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M39 28C41 25 44 23 48 23C51 23 53 25 54 27"
            stroke="#0F382A"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M58 32H75C75 26 71 23 66 23C60 23 57 28 57 33C57 38 61 41 68 41C72 41 74 39 76 37"
            stroke="#0F382A"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M79 23L88 40L98 23"
            stroke="#0F382A"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="115"
            cy="32"
            r="9"
            stroke="#0F382A"
            strokeWidth="5"
          />
        </svg>
      </button>

      {showTitleGroup && (
        <div className="page-heading-group">
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      )}
    </header>
  );
};
