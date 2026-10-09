'use client';
import React from 'react';

interface AppContainerProps {
  children: React.ReactNode;
  className?: string;
  fluid?: boolean;
  wideBackground?: string;
}

export default function AppContainer({
  children,
  className = '',
  fluid = false,
  wideBackground = 'transparent',
}: AppContainerProps) {
  return (
    <div
      className="w-full h-auto flex justify-center items-center"
      style={{
        background: wideBackground,
      }}
    >
      <div
        className={`
        w-full
        ${fluid ? '' : 'max-w-[1440px] mx-auto'}
        px-4 sm:px-8 md:px-10 lg:px-16 xxl:px-0
        ${className}
      `}
      >
        {children}
      </div>
    </div>
  );
}
