
import React from 'react';
import { useDisplay } from './DisplayContext';

interface BoundingBoxProps {
  name: string;
  children: React.ReactNode;
  className?: string;
}

export const BoundingBox: React.FC<BoundingBoxProps> = ({ name, children, className }) => {
  const { showBoundingBoxes } = useDisplay();

  if (!showBoundingBoxes) {
    return <>{children}</>;
  }

  return (
    <div className={`relative border border-dashed border-blue-500 p-2 m-1 ${className || ''}`}>
      <span style={{ top: '-10px', left: '4px' }} className="absolute bg-blue-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm z-10 select-none pointer-events-none">
        {name}
      </span>
      {children}
    </div>
  );
};
