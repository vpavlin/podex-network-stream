
import React from 'react';

interface PodexLogoProps {
  className?: string;
}

const PodexLogo: React.FC<PodexLogoProps> = ({ className }) => {
  return (
    <svg 
      width="140" 
      height="40" 
      viewBox="0 0 140 40" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <style>
        {`
        .letter { font-family: Arial, sans-serif; font-weight: bold; font-size: 28px; }
        .icon-circle { fill: black; }
        .wave { stroke: white; stroke-width: 2; fill: none; }
        `}
      </style>
      
      <rect x="0" y="0" width="140" height="40" fill="none"/>
      
      <circle className="icon-circle" cx="20" cy="20" r="15"/>
      <path className="wave" d="M10,20 Q15,15 20,20 T30,20"/>
      <path className="wave" d="M12,14 Q17,9 22,14 T32,14"/>
      <path className="wave" d="M12,26 Q17,31 22,26 T32,26"/>
      
      <text x="42" y="28" className="letter">PODEX</text>
    </svg>
  );
};

export default PodexLogo;
