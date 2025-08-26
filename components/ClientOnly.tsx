"use client";

import { FC, ReactNode, useEffect, useState } from "react";

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ClientOnly: FC<ClientOnlyProps> = ({
  children,
  fallback = (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading...</p>
      </div>
    </div>
  ),
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
