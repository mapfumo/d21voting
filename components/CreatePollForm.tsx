"use client";

import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createProgram } from "../lib/solana-clean";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "bn.js";
import { toast } from "react-hot-toast";

interface CreatePollFormProps {
  onPollCreated: (pollData?: any) => void;
}

export const CreatePollForm: FC<CreatePollFormProps> = ({ onPollCreated }) => {
  const { publicKey, signTransaction } = useWallet();
  const [formData, setFormData] = useState({
    pollId: "",
    title: "",
    maxCandidates: "5",
    maxVotesPerVoter: "3",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signTransaction) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);

      console.log("Wallet publicKey:", publicKey);
      console.log("Wallet signTransaction:", signTransaction);

      // Create a proper wallet object that matches the Wallet interface
      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions: async (transactions: any[]) => {
          return transactions.map((tx) => tx);
        },
        payer: publicKey, // Add the required payer property
      };

      console.log("Created wallet object:", wallet);
      const program = await createProgram(wallet as any);
      console.log("Program created:", program);

      // Generate poll PDA
      const [pollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll"),
          publicKey.toBuffer(),
          new BN(formData.pollId).toArrayLike(Buffer, "le", 8),
        ],
        new PublicKey(program.programId)
      );

      console.log("Form data pollId:", formData.pollId);
      console.log("BN constructor:", BN);
      console.log("BN type:", typeof BN);

      if (!BN) {
        throw new Error("BN constructor is undefined");
      }

      const pollId = new BN(formData.pollId);
      console.log("Created pollId BN:", pollId);

      const maxCandidates = parseInt(formData.maxCandidates);
      const maxVotesPerVoter = parseInt(formData.maxVotesPerVoter);
      const maxTitleBytes = formData.title.length + 100; // Add buffer

      const result = await program.methods
        .create_poll(
          pollId,
          formData.title,
          maxCandidates,
          maxVotesPerVoter,
          maxTitleBytes
        )
        .accounts({
          authority: publicKey,
          poll: pollPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const tx = result.signature;
      // Create a clickable transaction link
      const transactionLink = `https://explorer.solana.com/tx/${tx}?cluster=devnet`;

      toast.success(
        (t) => (
          <div className="flex flex-col space-y-3">
            <span className="text-center font-medium text-green-400">
              Poll created successfully! 🎉
            </span>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-300 mb-2">Transaction ID:</div>
              <div className="font-mono text-xs text-blue-400 break-all mb-2">
                {tx}
              </div>
              <a
                href={transactionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <span>🔍</span>
                <span>View on Solana Explorer</span>
              </a>
            </div>
          </div>
        ),
        { duration: 15000 }
      );

      // Create poll data object to pass to callback
      const pollData = {
        publicKey: pollPda.toString(),
        account: {
          authority: publicKey.toString(),
          pollId: formData.pollId,
          isOpen: true,
          maxVotesPerVoter: parseInt(formData.maxVotesPerVoter),
          maxCandidates: parseInt(formData.maxCandidates),
          candidateCount: 0, // Start with no candidates
          title: formData.title,
          voteCounts: [], // Initialize with empty vote counts
        },
        candidates: [], // Initialize with empty candidates array
      };

      // Show success message with transaction details and link back to home
      toast.success(
        (t) => (
          <div className="flex flex-col space-y-3">
            <span className="text-center font-medium text-green-400">
              Poll created successfully! 🎉
            </span>

            {/* Transaction Details */}
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-300 mb-2">Transaction ID:</div>
              <div className="font-mono text-xs text-blue-400 break-all mb-2">
                {tx}
              </div>
              <a
                href={`https://explorer.solana.com/tx/${tx}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors mb-3"
              >
                <span>🔍</span>
                <span>View on Solana Explorer</span>
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  onPollCreated(); // Just call without data to trigger navigation
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1"
              >
                View All Polls
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Stay Here
              </button>
            </div>
          </div>
        ),
        { duration: 15000 }
      );
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Create New Poll</h3>
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
        >
          🏠 Home
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="pollId"
            className="block text-sm font-medium text-gray-200 mb-1"
          >
            Poll ID
          </label>
          <input
            type="number"
            id="pollId"
            name="pollId"
            value={formData.pollId}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
            placeholder="Enter unique poll ID"
          />
        </div>

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-200 mb-1"
          >
            Poll Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
            placeholder="Enter poll title"
          />
        </div>

        <div>
          <label
            htmlFor="maxCandidates"
            className="block text-sm font-medium text-gray-200 mb-1"
          >
            Maximum Candidates
          </label>
          <input
            type="number"
            id="maxCandidates"
            name="maxCandidates"
            value={formData.maxCandidates}
            onChange={handleInputChange}
            required
            min="1"
            max="100"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
          />
        </div>

        <div>
          <label
            htmlFor="maxVotesPerVoter"
            className="block text-sm font-medium text-gray-200 mb-1"
          >
            Maximum Votes Per Voter
          </label>
          <input
            type="number"
            id="maxVotesPerVoter"
            name="maxVotesPerVoter"
            value={formData.maxVotesPerVoter}
            onChange={handleInputChange}
            required
            min="1"
            max="100"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
          />
        </div>

        {/* Fee Information */}
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-yellow-400">💰</span>
            <span className="text-yellow-300 font-medium">
              Voting Fee Information
            </span>
          </div>
          <div className="text-sm text-yellow-200">
            <p>
              • Each voter will pay{" "}
              <span className="font-semibold">0.001 LAMPORTS</span> to cast
              their vote
            </p>
            <p>
              • This fee helps prevent spam voting and covers transaction costs
            </p>
            <p>• Fees are collected and can be used for poll maintenance</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => onPollCreated()}
            className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Poll"}
          </button>
        </div>
      </form>

      {/* Back to Home Link */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <button
          onClick={() => onPollCreated()}
          className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <span>←</span>
          <span>Back to All Polls</span>
        </button>
      </div>
    </div>
  );
};
