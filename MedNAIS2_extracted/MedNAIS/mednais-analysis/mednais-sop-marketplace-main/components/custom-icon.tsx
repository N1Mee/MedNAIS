import React from 'react';

interface CustomIconProps {
  className?: string;
}

export const CustomIcon: React.FC<CustomIconProps> = ({ className = "h-10 w-10" }) => {
  return (
    <svg
      width="1024"
      height="1024"
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="1024" height="1024" className="icon-bg" />
      <path d="M260 487L332 552V834H260V487Z" className="icon-primary" />
      <path d="M765 467L693 535.746V834H765V467Z" className="icon-primary" />
      <rect x="280.72" y="317" width="414.803" height="108.019" transform="rotate(43.7672 280.72 317)"
        className="icon-accent" />
      <rect x="922.382" y="265.381" width="589.729" height="108.019"
        transform="rotate(135 922.382 265.381)" className="icon-accent" />
    </svg>
  );
};