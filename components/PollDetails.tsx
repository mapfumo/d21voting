"use client";

import { FC, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import { PublicKey } from "@solana/web3.js";
import { Poll, Candidate } from "../lib/types";

interface PollDetailsProps {
  poll: Poll;
  viewMode: "details" | "results";
  onClose: () => void;
  onPollUpdated: () => void;
  onViewModeChange?: (mode: "details" | "results") => void;
}

export const PollDetails: FC<PollDetailsProps> = ({
  poll,
  viewMode,
  onClose,
  onPollUpdated,
  onViewModeChange,
}) => {
  const { publicKey, signTransaction } = useWallet();
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Initialize candidates from poll data if available
  useEffect(() => {
    console.log("🔍 useEffect triggered with poll:", poll);
    if (poll && poll.account) {
      console.log("🔍 Poll account data:", poll.account);
      console.log("🔍 Poll candidate count:", poll.account.candidateCount);

      if (poll.account.candidateCount > 0) {
        console.log(
          "🔍 Poll has existing candidates:",
          poll.account.candidateCount
        );
        // For now, create placeholder candidates based on candidateCount
        // This will be replaced when we implement proper candidate fetching
        const placeholderCandidates: Candidate[] = Array.from(
          { length: poll.account.candidateCount },
          (_, index) => ({
            publicKey: `placeholder_${index}`,
            account: {
              name: `Candidate ${index + 1}`,
              index: index,
            },
          })
        );
        setCandidates(placeholderCandidates);
        console.log("🔍 Set placeholder candidates:", placeholderCandidates);
      } else {
        console.log("🔍 Poll has no existing candidates");
        setCandidates([]);
      }
    } else {
      console.log("🔍 No poll data available");
      setCandidates([]);
    }
  }, [poll]);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showVoteForm, setShowVoteForm] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch candidates from blockchain
  const fetchCandidates = async () => {
    try {
      console.log("Fetching candidates from blockchain...");
      setLoading(true);

      // Get the program from solana-clean.ts
      const { createProgram } = await import("../lib/solana-clean");

      // Create a proper provider object
      const provider = {
        publicKey,
        signTransaction,
        signAllTransactions: signTransaction,
      };

      const program = await createProgram(provider);

      // Fetch candidates for this specific poll from blockchain
      if (poll && poll.publicKey) {
        const blockchainCandidates = await program.account.candidate.forPoll(
          poll.publicKey
        );
        console.log(
          "Blockchain candidates for this poll:",
          blockchainCandidates
        );

        if (blockchainCandidates && blockchainCandidates.length > 0) {
          // Filter out null values and transform to match Candidate interface
          const validCandidates = blockchainCandidates
            .filter(
              (candidate): candidate is NonNullable<typeof candidate> =>
                candidate !== null
            )
            .map((candidate) => ({
              publicKey: candidate.publicKey,
              account: {
                name: candidate.account.name,
                index: candidate.account.index,
              },
            }));

          setCandidates(validCandidates);
          console.log(
            "✅ Candidates loaded from blockchain:",
            validCandidates.length
          );
        } else {
          console.log("❌ No candidates found on blockchain for this poll");
          setCandidates([]);
        }
      } else {
        console.log("❌ No poll selected, cannot fetch candidates");
        setCandidates([]);
      }
    } catch (error) {
      console.error("Error fetching candidates from blockchain:", error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  // Load candidates from blockchain or fall back to local storage
  useEffect(() => {
    if (poll && poll.account.candidateCount > 0) {
      fetchCandidates();
    }
  }, [poll]);

  const handleAddCandidate = async () => {
    if (!newCandidateName.trim()) {
      toast.error("Please enter a candidate name");
      return;
    }

    if (candidates.length >= poll.account.maxCandidates) {
      toast.error("Maximum number of candidates reached");
      return;
    }

    if (!publicKey) {
      toast.error("Please connect your wallet to add candidates");
      return;
    }

    try {
      setLoading(true);

      // Import Solana web3.js for transaction creation
      const {
        Connection,
        PublicKey,
        Transaction,
        SystemProgram,
        LAMPORTS_PER_SOL,
      } = await import("@solana/web3.js");

      // Connect to Solana devnet
      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );

      // Get the program from our solana-clean.ts
      const { createProgram } = await import("../lib/solana-clean");

      // Create a proper provider object with the required methods
      const provider = {
        publicKey,
        signTransaction,
        signAllTransactions: signTransaction, // Add this if needed
      };

      const program = await createProgram(provider);

      // Find the next available candidate index
      // First, fetch existing candidates to see what indices are already used
      console.log(
        "🔍 Fetching existing candidates to find next available index..."
      );
      const existingCandidates = await program.account.candidate.forPoll(
        poll.publicKey
      );

      console.log(
        "🔍 Existing candidates from blockchain:",
        existingCandidates
      );

      // Find the next available index by looking at existing indices
      let nextIndex = 0;
      if (existingCandidates && existingCandidates.length > 0) {
        // Get all existing indices and find the next available one
        const existingIndices = existingCandidates
          .filter((c): c is NonNullable<typeof c> => c !== null)
          .map((c) => c.account.index)
          .sort((a, b) => a - b);
        console.log("🔍 Existing candidate indices:", existingIndices);

        // Find the first gap in the sequence, or use the next number after the highest
        for (
          let i = 0;
          i <= existingIndices[existingIndices.length - 1] + 1;
          i++
        ) {
          if (!existingIndices.includes(i)) {
            nextIndex = i;
            break;
          }
        }
      }

      console.log("🔍 Current candidates array:", candidates);
      console.log("🔍 Poll candidate count:", poll.account.candidateCount);
      console.log("🔍 Next available index:", nextIndex);

      // Create candidate PDA
      const indexBuffer = Buffer.alloc(2);
      indexBuffer.writeUint16LE(nextIndex, 0);

      console.log("🔍 Index buffer:", indexBuffer);
      console.log("🔍 Index buffer as hex:", indexBuffer.toString("hex"));

      // Debug: Log all seeds to ensure they're unique
      const seeds = [
        Buffer.from("candidate"),
        new PublicKey(poll.publicKey).toBuffer(),
        indexBuffer,
      ];

      console.log("🔍 PDA seeds:", {
        candidate: seeds[0].toString("hex"),
        poll: seeds[1].toString("hex"),
        index: seeds[2].toString("hex"),
        indexValue: nextIndex,
      });

      const [candidatePda] = PublicKey.findProgramAddressSync(
        seeds,
        new PublicKey("2CNQMKvkPPfgiZFKJar6gyWc6bquTV2jW7NEHMfynLBs")
      );

      console.log("🔍 Generated PDA:", candidatePda.toString());
      console.log(
        "🔍 PDA seeds used:",
        seeds.map((s) => s.toString("hex"))
      );

      console.log("Adding candidate to blockchain:", {
        name: newCandidateName.trim(),
        index: nextIndex,
        candidatePda: candidatePda.toString(),
      });

      // Call the add_candidate instruction on the blockchain
      const tx = await program.methods
        .add_candidate(
          nextIndex, // index
          newCandidateName.trim(), // name
          newCandidateName.trim().length + 100 // max_name_bytes with buffer
        )
        .accounts({
          poll: new PublicKey(poll.publicKey),
          candidate: candidatePda,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Candidate added to blockchain successfully:", tx);

      // Show success message with transaction details
      const transactionSignature =
        typeof tx === "string" ? tx : tx.signature || "Unknown";
      const transactionLink = `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`;

      toast.success(
        (t) => (
          <div className="flex flex-col space-y-3">
            <span className="text-center font-medium text-green-400">
              Candidate added to blockchain successfully! 🎉
            </span>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-300 mb-2">Transaction ID:</div>
              <div className="font-mono text-xs text-blue-400 break-all mb-2">
                {transactionSignature}
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

      // Update local state
      const newCandidate: Candidate = {
        publicKey: candidatePda.toString(),
        account: {
          name: newCandidateName.trim(),
          index: nextIndex,
        },
      };

      setCandidates([...candidates, newCandidate]);
      setNewCandidateName("");
      setShowAddCandidate(false);

      // Refresh the poll data
      if (onPollUpdated) {
        onPollUpdated();
      }

      // Refresh candidates for this poll
      await fetchCandidates();
    } catch (error) {
      console.error("Error adding candidate to blockchain:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("User rejected")) {
        toast.error("Transaction was rejected by user");
      } else if (errorMessage.includes("insufficient funds")) {
        toast.error("Insufficient balance to add candidate");
      } else {
        toast.error(`Failed to add candidate: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCandidateSelection = (index: number) => {
    setSelectedCandidates((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : prev.length < poll.account.maxVotesPerVoter
          ? [...prev, index]
          : prev
    );
  };

  // Delete a candidate from a poll
  const handleDeleteCandidate = async (
    candidatePublicKey: string,
    candidateName: string
  ) => {
    if (!publicKey) {
      toast.error("Please connect your wallet to delete candidates");
      return;
    }

    if (!signTransaction) {
      toast.error("Your wallet does not support signing transactions");
      return;
    }

    // Confirm deletion
    if (
      !confirm(
        `Are you sure you want to delete candidate "${candidateName}"? This will close the entire poll and remove all candidates. This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      console.log(
        "🗑️ Deleting candidate by closing poll on Solana blockchain..."
      );

      // Get the program client
      const { createProgram } = await import("../lib/solana-clean");
      const program = await createProgram({ publicKey } as any);

      // Since there's no delete_candidate instruction, we'll close the poll instead
      // This effectively removes all candidates from the poll
      console.log("🔄 Closing poll to remove all candidates...");

      const tx = await program.methods
        .delete_candidate()
        .accounts({
          authority: publicKey,
          poll: new PublicKey(poll.publicKey),
          candidate: new PublicKey(candidatePublicKey),
        })
        .rpc();

      console.log("✅ Poll closed successfully:", tx);

      // Show success message
      toast.success(
        `Candidate "${candidateName}" deleted successfully! Poll has been closed. 🗑️`
      );

      // Close the modal since the poll is now closed
      onClose();

      // Refresh the poll data
      if (onPollUpdated) {
        onPollUpdated();
      }
    } catch (error) {
      console.error("❌ Error deleting candidate:", error);
      toast.error(
        `Failed to delete candidate: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClosePoll = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet to close the poll");
      return;
    }

    if (!signTransaction) {
      toast.error("Your wallet does not support signing transactions");
      return;
    }

    try {
      setLoading(true);
      console.log("🔒 Closing poll on Solana blockchain...");

      // Get the program client
      const { createProgram } = await import("../lib/solana-clean");
      const program = await createProgram({ publicKey } as any);

      // Create the close poll instruction
      console.log("🔄 Creating close poll instruction...");
      const closePollInstruction = await program.client.closePoll(
        publicKey,
        new PublicKey(poll.publicKey)
      );

      // Get recent blockhash
      const { Connection } = await import("@solana/web3.js");
      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );
      const { blockhash } = await connection.getLatestBlockhash();

      // Create Solana Transaction object
      const { Transaction } = await import("@solana/web3.js");
      const transaction = new Transaction();

      // Add the close poll instruction
      transaction.add(closePollInstruction);

      // Set recent blockhash and fee payer
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log("✅ Transaction prepared for wallet signing");

      // Sign the transaction
      console.log(
        "🔐 Requesting wallet signature for close poll transaction..."
      );
      const signedTransaction = await signTransaction(transaction);
      console.log("✅ Transaction signed successfully");

      // Send the transaction to the blockchain
      console.log("📡 Sending close poll transaction to Solana devnet...");
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(
        signature,
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error("Transaction failed to confirm");
      }

      console.log("✅ Poll closed successfully:", signature);

      // Show success message
      toast.success("Poll closed successfully! 🎉");

      // Update local state
      poll.account.isOpen = false;

      // Refresh the poll data
      if (onPollUpdated) {
        onPollUpdated();
      }
    } catch (error) {
      console.error("❌ Error closing poll:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Failed to close poll: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate");
      return;
    }

    if (!publicKey) {
      toast.error("Please connect your wallet to vote");
      return;
    }

    if (!signTransaction) {
      toast.error("Your wallet does not support signing transactions");
      return;
    }

    // Declare feeToast at function scope so it can be used in catch blocks
    let feeToast: string | undefined;

    try {
      setLoading(true);

      // Create a real Solana transaction for the voting fee
      console.log("Creating voting fee transaction: 0.001 LAMPORTS");

      try {
        // Import Solana web3.js for transaction creation
        const {
          Connection,
          PublicKey,
          Transaction,
          SystemProgram,
          LAMPORTS_PER_SOL,
        } = await import("@solana/web3.js");

        // Connect to Solana devnet
        const connection = new Connection(
          "https://api.devnet.solana.com",
          "confirmed"
        );

        // Check user balance before proceeding
        const balance = await connection.getBalance(publicKey);
        const feeAmount = 0.001 * LAMPORTS_PER_SOL; // Convert to lamports

        if (balance < feeAmount) {
          toast.error(
            `Insufficient balance. You need at least ${
              feeAmount / LAMPORTS_PER_SOL
            } SOL to pay the voting fee.`
          );
          return;
        }

        // Create a simple transfer transaction for the voting fee
        // Send the fee to the poll creator (authority)
        const feeRecipient = new PublicKey(poll.account.authority);

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();

        // Create transaction
        const transaction = new Transaction({
          recentBlockhash: blockhash,
          feePayer: publicKey,
        });

        // Add transfer instruction (without memo for now)
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: feeRecipient,
            lamports: feeAmount,
          })
        );

        // Request wallet signature
        console.log("Requesting wallet signature for fee transaction...");
        const feeToast = toast.loading(
          "Please approve the fee transaction in your wallet"
        );

        if (!signTransaction) {
          toast.dismiss(feeToast);
          throw new Error("Wallet does not support signing transactions");
        }

        // Sign the transaction
        const signedTransaction = await signTransaction(transaction);
        console.log("Transaction signed successfully");

        // Send the transaction
        console.log("Sending fee transaction to network...");
        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize()
        );

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(
          signature,
          "confirmed"
        );

        if (confirmation.value.err) {
          throw new Error("Transaction failed to confirm");
        }

        console.log("Fee transaction confirmed:", signature);

        // Dismiss the loading toast
        toast.dismiss(feeToast);

        // Show success message with transaction details
        const transactionLink = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

        toast.success(
          (t) => (
            <div className="flex flex-col space-y-3">
              <span className="text-center font-medium text-green-400">
                Voting fee processed successfully! 💰
              </span>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-gray-300 mb-2">
                  Transaction ID:
                </div>
                <div className="font-mono text-xs text-blue-400 break-all mb-2">
                  {signature}
                </div>
                <a
                  href={transactionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <span>🔍</span>
                  <span>View on Solana Explorer</span>
                </a>
              </div>
            </div>
          ),
          { duration: 15000 }
        );

        // Fee transaction completed successfully
        console.log("✅ Voting fee transaction completed on blockchain");
      } catch (transactionError) {
        console.error(
          "Error processing voting fee transaction:",
          transactionError
        );

        // Dismiss the loading toast
        toast.dismiss(feeToast);

        const errorMessage =
          transactionError instanceof Error
            ? transactionError.message
            : String(transactionError);

        if (errorMessage.includes("User rejected")) {
          toast.error("Voting fee transaction was rejected by user");
        } else if (errorMessage.includes("insufficient funds")) {
          toast.error("Insufficient balance to pay voting fee");
        } else {
          toast.error(`Failed to process voting fee: ${errorMessage}`);
        }
        return;
      }

      // Real blockchain voting
      try {
        console.log(
          "🗳️ Casting votes on Solana blockchain using D21VotingClient..."
        );

        // Get the program client
        const { createProgram } = await import("../lib/solana-clean");
        const program = await createProgram({ publicKey } as any);

        // Get recent blockhash
        const { Connection } = await import("@solana/web3.js");
        const connection = new Connection(
          "https://api.devnet.solana.com",
          "confirmed"
        );
        const { blockhash } = await connection.getLatestBlockhash();

        // Create vote record PDA
        const [voteRecordPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("vote"),
            new PublicKey(poll.publicKey).toBuffer(),
            publicKey.toBuffer(),
          ],
          new PublicKey("2CNQMKvkPPfgiZFKJar6gyWc6bquTV2jW7NEHMfynLBs")
        );

        console.log("🔍 Vote record PDA:", voteRecordPda.toString());

        console.log("🔍 Selected candidates:", selectedCandidates);

        // Check if vote record already exists
        const voteRecordAccountInfo =
          await connection.getAccountInfo(voteRecordPda);
        const voteRecordExists = voteRecordAccountInfo !== null;

        let transaction: any;

        if (!voteRecordExists) {
          // Initialize the vote record if it doesn't exist
          console.log("🔄 Initializing vote record...");
          const initVoteRecordInstruction = await program.client.initVoteRecord(
            publicKey,
            new PublicKey(poll.publicKey),
            voteRecordPda
          );

          // Create the voting instruction with selected candidate indices
          console.log("🔄 Creating voting instruction...");
          const castVotesInstruction = await program.client.castVotes(
            publicKey,
            new PublicKey(poll.publicKey),
            voteRecordPda,
            selectedCandidates // Pass the selected candidate indices
          );

          // Create Solana Transaction object
          const { Transaction: SolanaTransaction } = await import(
            "@solana/web3.js"
          );
          transaction = new SolanaTransaction();

          // Add both instructions
          transaction.add(initVoteRecordInstruction);
          transaction.add(castVotesInstruction);
        } else {
          // Vote record already exists, just create the voting instruction
          console.log(
            "🔄 Vote record already exists, creating voting instruction..."
          );
          const castVotesInstruction = await program.client.castVotes(
            publicKey,
            new PublicKey(poll.publicKey),
            voteRecordPda,
            selectedCandidates // Pass the selected candidate indices
          );

          // Add only the voting instruction
          transaction.add(castVotesInstruction);
        }

        // Set recent blockhash and fee payer
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        console.log("✅ Transaction prepared for wallet signing");

        // Use the existing wallet context from the component
        if (!signTransaction) {
          throw new Error("Wallet does not support signing transactions");
        }

        // Sign the transaction
        console.log("🔐 Requesting wallet signature for voting transaction...");
        const signedTransaction = await signTransaction(transaction);
        console.log("✅ Transaction signed successfully");

        // Send the transaction to the blockchain
        console.log("📡 Sending voting transaction to Solana devnet...");

        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize()
        );

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(
          signature,
          "confirmed"
        );

        if (confirmation.value.err) {
          throw new Error("Transaction failed to confirm");
        }

        console.log("✅ Voting transaction confirmed:", signature);

        // Use the signature from the confirmed transaction
        const transactionSignature = signature;

        console.log("✅ Voting transaction signature:", transactionSignature);

        // Show success message with transaction details
        const transactionLink = `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`;

        toast.success(
          (t) => (
            <div className="flex flex-col space-y-3">
              <span className="text-center font-medium text-green-400">
                Votes cast successfully on blockchain! 🎉
              </span>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-gray-300 mb-2">
                  Transaction ID:
                </div>
                <div className="font-mono text-xs text-blue-400 break-all mb-2">
                  {transactionSignature}
                </div>
                <a
                  href={transactionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-3 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <span>🔍</span>
                  <span>View on Solana Explorer</span>
                </a>
              </div>
            </div>
          ),
          { duration: 15000 }
        );

        // Update local state to reflect the vote
        setSelectedCandidates([]);
        setShowVoteForm(false);

        // Refresh the poll data to show updated vote counts
        if (onPollUpdated) {
          onPollUpdated();
        }
      } catch (votingError) {
        console.error("❌ Error casting votes on blockchain:", votingError);
        const errorMessage =
          votingError instanceof Error
            ? votingError.message
            : String(votingError);
        toast.error(`Failed to cast votes: ${errorMessage}`);
        return;
      }

      toast.success("Vote cast successfully! Fee: 0.001 LAMPORTS");
      setSelectedCandidates([]);
      setShowVoteForm(false);
      onPollUpdated();
    } catch (error) {
      console.error("Error casting vote:", error);
      toast.error("Failed to cast vote");
    } finally {
      setLoading(false);
    }
  };

  const isAuthority = publicKey?.toString() === poll.account.authority;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {viewMode === "results"
              ? `${poll.account.title} - Results`
              : poll.account.title}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              🏠 Home
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              Back to All Polls
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Poll Info - Only show in details mode */}
        {viewMode === "details" && (
          <div className="p-6 border-b border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Status</div>
                <div
                  className={`font-semibold ${
                    poll.account.isOpen ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {poll.account.isOpen ? "Open" : "Closed"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Candidates</div>
                <div className="font-semibold text-white">
                  {candidates.length}/{poll.account.maxCandidates}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Votes Per Voter</div>
                <div className="font-semibold text-white">
                  {poll.account.maxVotesPerVoter}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Voting Fee</div>
                <div className="font-semibold text-yellow-400">
                  0.001 LAMPORTS
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions - Only show in details mode */}
        {viewMode === "details" && (
          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-wrap gap-3">
              {poll.account.isOpen && (
                <>
                  <button
                    onClick={() => setShowAddCandidate(true)}
                    disabled={candidates.length >= poll.account.maxCandidates}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Add Candidate
                  </button>
                  <button
                    onClick={() => setShowVoteForm(true)}
                    disabled={candidates.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    title={
                      candidates.length === 0
                        ? "No candidates available for voting"
                        : "Click to vote (0.001 LAMPORTS fee)"
                    }
                  >
                    Vote (0.001 LAMPORTS){" "}
                    {candidates.length === 0 && "(No Candidates)"}
                  </button>
                </>
              )}
              {isAuthority && poll.account.isOpen && (
                <button
                  onClick={handleClosePoll}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {loading ? "Closing..." : "Close Poll"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Candidates - Only show in details mode */}
        {viewMode === "details" && (
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Candidates
            </h3>
            {candidates.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No candidates added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {candidates.map((candidate, index) => (
                  <div
                    key={candidate.publicKey}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 text-sm">
                        #{candidate.account.index + 1}
                      </span>
                      <span className="text-white font-medium">
                        {candidate.account.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Votes</div>
                        <div className="text-white font-semibold">
                          {poll.account.voteCounts[index] || 0}
                        </div>
                      </div>
                      {isAuthority && poll.account.isOpen && (
                        <button
                          onClick={() =>
                            handleDeleteCandidate(
                              candidate.publicKey,
                              candidate.account.name
                            )
                          }
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-1 px-3 rounded-md transition-colors duration-200 text-sm"
                          title="Delete this candidate (will close the entire poll)"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Poll Results View */}
        {viewMode === "results" && (
          <div className="p-6 border-t border-gray-700 bg-gray-800">
            <h3 className="text-xl font-semibold text-white mb-4">
              Poll Results
            </h3>

            {/* Results Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {poll.account.voteCounts.reduce(
                    (sum, count) => sum + count,
                    0
                  )}
                </div>
                <div className="text-sm text-gray-400">Total Votes</div>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {candidates.length}
                </div>
                <div className="text-sm text-gray-400">Candidates</div>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  {poll.account.maxVotesPerVoter}
                </div>
                <div className="text-sm text-gray-400">Votes Per Voter</div>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">
                  0.001 LAMPORTS
                </div>
                <div className="text-sm text-gray-400">Voting Fee</div>
              </div>
            </div>

            {/* Candidate Results */}
            {candidates.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Candidate Performance
                </h4>
                <div className="space-y-3">
                  {candidates.map((candidate, index) => {
                    const voteCount = poll.account.voteCounts[index] || 0;
                    const totalVotes = poll.account.voteCounts.reduce(
                      (sum, count) => sum + count,
                      0
                    );
                    const percentage =
                      totalVotes > 0
                        ? ((voteCount / totalVotes) * 100).toFixed(1)
                        : "0";

                    return (
                      <div
                        key={candidate.publicKey}
                        className="bg-gray-700 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-semibold text-white">
                              #{candidate.account.index + 1}
                            </span>
                            <span className="text-white font-medium">
                              {candidate.account.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-400">
                              {voteCount}
                            </div>
                            <div className="text-sm text-gray-400">
                              {percentage}%
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-600 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Candidates Message */}
            {candidates.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">📊</div>
                <p className="text-gray-400">
                  No candidates have been added to this poll yet.
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Add candidates to see voting results.
                </p>
              </div>
            )}

            {/* Fee Collection Summary */}
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-semibold text-yellow-300 mb-3">
                💰 Fee Collection Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="text-center">
                  <div className="text-yellow-400 font-bold text-xl">
                    {poll.account.voteCounts.reduce(
                      (sum, count) => sum + count,
                      0
                    ) * 0.001}
                  </div>
                  <div className="text-yellow-500">
                    Total LAMPORTS Collected
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 font-bold text-xl">
                    {poll.account.voteCounts.reduce(
                      (sum, count) => sum + count,
                      0
                    )}
                  </div>
                  <div className="text-yellow-500">Total Fee Transactions</div>
                </div>
              </div>

              {/* Recent Fee Transactions */}
              <div className="mt-4">
                <h5 className="text-md font-semibold text-yellow-300 mb-2">
                  Recent Fee Transactions
                </h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  <p className="text-yellow-200 text-sm text-center py-2">
                    Fee transactions are recorded on the Solana blockchain
                  </p>
                  <p className="text-yellow-300 text-xs text-center">
                    Check the Solana Explorer for transaction history
                  </p>
                </div>
              </div>
            </div>

            {/* Results Actions */}
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  if (onViewModeChange) {
                    onViewModeChange("details");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                View Details
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Back to All Polls
              </button>
            </div>
          </div>
        )}

        {/* Add Candidate Modal */}
        {showAddCandidate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">
                Add Candidate
              </h3>
              <input
                type="text"
                value={newCandidateName}
                onChange={(e) => setNewCandidateName(e.target.value)}
                placeholder="Enter candidate name"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-400 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAddCandidate}
                  disabled={loading || !newCandidateName.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex-1"
                >
                  {loading ? "Adding..." : "Add Candidate"}
                </button>
                <button
                  onClick={() => setShowAddCandidate(false)}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vote Modal */}
        {showVoteForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">
                Cast Your Vote
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Select up to {poll.account.maxVotesPerVoter} candidate(s)
              </p>

              {/* Fee Information */}
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400">💰</span>
                    <span className="text-yellow-300 text-sm font-medium">
                      Voting Fee
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">
                      0.001 LAMPORTS
                    </div>
                    <div className="text-yellow-500 text-xs">
                      Required to vote
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {candidates.map((candidate, index) => (
                  <label
                    key={candidate.publicKey}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(index)}
                      onChange={() => toggleCandidateSelection(index)}
                      className="rounded border-gray-600 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-white">{candidate.account.name}</span>
                  </label>
                ))}
              </div>

              {/* Vote Summary */}
              <div className="bg-gray-700 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Selected Candidates:</span>
                  <span className="text-white font-medium">
                    {selectedCandidates.length} /{" "}
                    {poll.account.maxVotesPerVoter}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-gray-300">Total Cost:</span>
                  <span className="text-yellow-400 font-medium">
                    0.001 LAMPORTS
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleVote}
                  disabled={loading || selectedCandidates.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex-1"
                >
                  {loading ? "Processing..." : `Vote (0.001 LAMPORTS)`}
                </button>
                <button
                  onClick={() => setShowVoteForm(false)}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-750">
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              ← Back to All Polls
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
