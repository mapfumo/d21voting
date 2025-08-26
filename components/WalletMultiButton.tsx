"use client";

import { FC, useEffect, useState } from "react";
import { WalletMultiButton as SolanaWalletMultiButton } from "@solana/wallet-adapter-react-ui";

export const WalletMultiButton: FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex justify-center">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 px-4 py-2">
          Loading...
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <SolanaWalletMultiButton className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200" />
    </div>
  );
};
