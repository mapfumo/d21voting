import React, { useState, useEffect } from "react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

interface TransactionFeeEstimatorProps {
  connection: Connection;
  transaction: Transaction;
  className?: string;
  showBreakdown?: boolean;
}

export const TransactionFeeEstimator: React.FC<
  TransactionFeeEstimatorProps
> = ({ connection, transaction, className = "", showBreakdown = true }) => {
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const estimateFee = async () => {
      if (!transaction || !connection) return;

      setLoading(true);
      setError(null);

      try {
        // Get recent blockhash for fee calculation
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        // Estimate fee
        const fee = await connection.getFeeForMessage(
          transaction.compileMessage(),
          blockhash
        );

        setEstimatedFee(fee.value);
      } catch (err) {
        console.error("Failed to estimate transaction fee:", err);
        setError(err instanceof Error ? err.message : "Failed to estimate fee");
        setEstimatedFee(null);
      } finally {
        setLoading(false);
      }
    };

    estimateFee();
  }, [connection, transaction]);

  const formatLamports = (lamports: number) => {
    const sol = lamports / 1e9;
    if (sol < 0.001) {
      return `${lamports} lamports`;
    }
    return `${sol.toFixed(6)} SOL`;
  };

  const getFeeColor = (fee: number) => {
    const sol = fee / 1e9;
    if (sol < 0.001) return "text-green-400";
    if (sol < 0.01) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className={`bg-gray-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-gray-300">Estimating transaction fee...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-900/20 border border-red-500/50 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center space-x-2">
          <span className="text-red-400">⚠️</span>
          <span className="text-red-300">Fee estimation failed: {error}</span>
        </div>
      </div>
    );
  }

  if (estimatedFee === null) {
    return null;
  }

  return (
    <div className={`bg-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-300">Transaction Fee</h4>
        <span className={`text-lg font-bold ${getFeeColor(estimatedFee)}`}>
          {formatLamports(estimatedFee)}
        </span>
      </div>

      {showBreakdown && (
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Base fee:</span>
            <span>5,000 lamports</span>
          </div>
          <div className="flex justify-between">
            <span>Instructions:</span>
            <span>{transaction.instructions.length} × 200 lamports</span>
          </div>
          <div className="flex justify-between">
            <span>Account creation:</span>
            <span>2,039,280 lamports</span>
          </div>
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between font-medium text-gray-300">
              <span>Total estimated:</span>
              <span>{formatLamports(estimatedFee)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300">
        💡 This is an estimate. Actual fees may vary based on network
        conditions.
      </div>
    </div>
  );
};

// Simplified fee display for inline use
export const FeeDisplay: React.FC<{
  fee: number | null;
  loading?: boolean;
}> = ({ fee, loading = false }) => {
  if (loading) {
    return <span className="text-gray-400">Calculating...</span>;
  }

  if (fee === null) {
    return <span className="text-gray-400">Unknown</span>;
  }

  const sol = fee / 1e9;
  const color =
    sol < 0.001
      ? "text-green-400"
      : sol < 0.01
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <span className={color}>
      {sol < 0.001 ? `${fee} lamports` : `${sol.toFixed(6)} SOL`}
    </span>
  );
};
