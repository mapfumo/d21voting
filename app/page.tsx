"use client";

import { WalletMultiButton } from "../components/WalletMultiButton";
import { useWallet } from "@solana/wallet-adapter-react";
import { VotingInterface } from "../components/VotingInterface";

export default function Home() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">D21 Voting App</h1>
          <p className="text-lg text-gray-300 mb-6">
            Decentralized voting powered by Solana
          </p>
          <WalletMultiButton />
        </header>

        <main>
          {connected ? (
            <VotingInterface />
          ) : (
            <div className="text-center">
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 max-w-md mx-auto">
                <h2 className="text-xl font-semibold mb-4 text-white">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-300 mb-4">
                  Please connect your Solana wallet to start voting
                </p>
                <WalletMultiButton />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
