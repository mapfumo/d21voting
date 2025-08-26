"use client";

import { FC, useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { CreatePollForm } from "./CreatePollForm";
import { PollList } from "./PollList";
import { PollDetails } from "./PollDetails";
import { toast } from "react-hot-toast";
import { PollSkeleton } from "./ui/SkeletonLoader";
import { SearchAndFilter } from "./ui/SearchAndFilter";
import {
  Breadcrumbs,
  getHomeBreadcrumbs,
  getPollListBreadcrumbs,
  getCreatePollBreadcrumbs,
  getPollDetailsBreadcrumbs,
} from "./ui/Breadcrumbs";
import { DashboardStats } from "./ui/DashboardStats";
import { EnhancedButton } from "./ui/EnhancedButton";

// Unified Poll interface that works for both PollList and PollDetails
interface Poll {
  publicKey: string;
  account: {
    title: string;
    isOpen: boolean;
    maxVotesPerVoter: number;
    maxCandidates: number;
    candidateCount: number;
    voteCounts: number[];
    authority: string;
    pollId: string;
    candidates?: Array<{
      publicKey: string;
      account: {
        poll: string;
        index: number;
        name: string;
      };
    }>;
  };
}

export const VotingInterface: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [viewMode, setViewMode] = useState<"details" | "results">("details");
  const [view, setView] = useState<
    "dashboard" | "polls" | "create" | "details"
  >("dashboard");

  // Debug loading state changes
  useEffect(() => {
    console.log("Loading state changed to:", loading);
  }, [loading]);

  const fetchPolls = async (publicKey: string) => {
    console.log("fetchPolls called with publicKey:", publicKey);
    setLoading(true);

    try {
      // First, try to get the program
      let program;
      try {
        const { createProgram } = await import("../lib/solana-clean");
        program = await createProgram({ publicKey } as any);
        console.log("✅ Program created successfully");
      } catch (programError) {
        console.log("❌ Failed to create program:", programError);
        program = null;
      }

      // Try to fetch polls using the program first
      if (program) {
        try {
          const blockchainPolls = await program.account.poll.all();

          console.log("Fetched polls from blockchain:", blockchainPolls);

          if (blockchainPolls && blockchainPolls.length > 0) {
            // Transform the blockchain polls to the expected format
            const transformedPolls: Poll[] = blockchainPolls.map(
              (poll: any) => ({
                publicKey: poll.publicKey.toString(),
                account: {
                  title: poll.account.title || "Untitled Poll",
                  candidateCount: poll.account.candidateCount || 0,
                  voteCounts: poll.account.voteCounts || [],
                  isOpen: poll.account.isOpen !== false,
                  maxVotesPerVoter: poll.account.maxVotesPerVoter || 3,
                  maxCandidates: poll.account.maxCandidates || 5,
                  authority: poll.account.authority?.toString() || publicKey,
                  pollId: poll.account.pollId?.toString() || "0",
                },
                candidates: [], // Will be fetched separately if needed
              })
            );

            console.log("Transformed blockchain polls:", transformedPolls);
            setPolls(transformedPolls);
            setFilteredPolls(transformedPolls);
            return;
          }
        } catch (programError) {
          console.log(
            "Failed to fetch polls using program, trying direct connection:",
            programError
          );
        }
      }

      // If program fetch fails, show empty state
      console.log("Program fetch failed, showing empty state");
      setPolls([]);
      setFilteredPolls([]);

      // If all blockchain methods fail, show empty state
      console.log("All blockchain methods failed, showing empty state");
      setPolls([]);
      setFilteredPolls([]);
    } catch (error) {
      console.error("Error fetching polls:", error);
      setPolls([]);
      setFilteredPolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Wallet connection changed:", {
      publicKey: publicKey?.toString(),
      loading: loading,
    });
    if (publicKey) {
      console.log("Wallet connected, fetching polls...");
      fetchPolls(publicKey.toString());

      // Safety timeout: if loading takes too long, force it to false
      const timeout = setTimeout(() => {
        if (loading) {
          console.log("Loading timeout reached, forcing loading to false");
          setLoading(false);
        }
      }, 10000);

      return () => clearTimeout(timeout);
    } else {
      console.log("Wallet disconnected, clearing polls");
      setPolls([]);
      setFilteredPolls([]);
    }
  }, [publicKey]);

  const handlePollUpdated = () => {
    if (publicKey) {
      fetchPolls(publicKey.toString());

      // If we're on the create form, navigate to polls list after creating
      if (view === "create") {
        setView("polls");
      }
    }
  };

  const handlePollSelected = (
    poll: Poll,
    viewMode: "details" | "results" = "details"
  ) => {
    setSelectedPoll(poll);
    setViewMode(viewMode);
    setView("details");
  };

  const handlePollDeleted = async (pollId: string) => {
    console.log("🗑️ Poll deleted:", pollId);

    // Remove from local state immediately
    const updatedPolls = polls.filter((poll) => poll.publicKey !== pollId);
    setPolls(updatedPolls);
    setFilteredPolls(updatedPolls);

    // Refresh from blockchain
    if (publicKey) {
      await fetchPolls(publicKey.toString());
    }
  };

  const handleCreatePoll = () => {
    setView("create");
  };

  const handleViewPolls = () => {
    setView("polls");
  };

  const handleViewDashboard = () => {
    setView("dashboard");
  };

  const handleBackToHome = () => {
    setView("dashboard");
    setSelectedPoll(null);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          🏠 Welcome to D21 Voting
        </h1>
        <p className="text-gray-400">
          Create, manage, and participate in polls on the Solana blockchain
        </p>
      </div>

      <DashboardStats polls={polls} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnhancedButton
          onClick={handleCreatePoll}
          variant="success"
          size="lg"
          icon="➕"
          fullWidth
          className="h-24"
        >
          Create New Poll
        </EnhancedButton>

        <EnhancedButton
          onClick={handleViewPolls}
          variant="primary"
          size="lg"
          icon="📊"
          fullWidth
          className="h-24"
        >
          View All Polls
        </EnhancedButton>
      </div>

      {polls.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">
            📊 Recent Polls
          </h3>
          <div className="space-y-2">
            {polls.slice(0, 3).map((poll) => (
              <div
                key={poll.publicKey}
                className="flex items-center justify-between p-3 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors duration-200 cursor-pointer"
                onClick={() => handlePollSelected(poll)}
              >
                <div>
                  <h4 className="text-white font-medium">
                    {poll.account.title}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {poll.account.candidateCount} candidates •{" "}
                    {poll.account.isOpen ? "🟢 Open" : "🔴 Closed"}
                  </p>
                </div>
                <span className="text-gray-400">→</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPollList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📊 All Polls</h1>
          <p className="text-gray-400">
            Manage and participate in voting polls
          </p>
        </div>
        <EnhancedButton onClick={handleCreatePoll} variant="success" icon="➕">
          Create Poll
        </EnhancedButton>
      </div>

      <SearchAndFilter polls={polls} onFilteredPollsChange={setFilteredPolls} />

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <PollSkeleton key={i} />
          ))}
        </div>
      ) : (
        <PollList
          polls={filteredPolls}
          onPollUpdated={handlePollUpdated}
          onPollSelected={handlePollSelected}
          onPollDeleted={handlePollDeleted}
        />
      )}
    </div>
  );

  const renderCreateForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">➕ Create New Poll</h1>
        <p className="text-gray-400">
          Set up a new voting poll for your community
        </p>
      </div>

      <CreatePollForm onPollCreated={handlePollUpdated} />
    </div>
  );

  const renderPollDetails = () => (
    <div className="space-y-6">
      {selectedPoll && (
        <PollDetails
          poll={selectedPoll}
          viewMode={viewMode}
          onClose={handleBackToHome}
          onPollUpdated={handlePollUpdated}
        />
      )}
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case "dashboard":
        return renderDashboard();
      case "polls":
        return renderPollList();
      case "create":
        return renderCreateForm();
      case "details":
        return renderPollDetails();
      default:
        return renderDashboard();
    }
  };

  const getBreadcrumbs = () => {
    switch (view) {
      case "dashboard":
        return getHomeBreadcrumbs(handleBackToHome);
      case "polls":
        return getPollListBreadcrumbs(handleBackToHome);
      case "create":
        return getCreatePollBreadcrumbs(handleBackToHome);
      case "details":
        return getPollDetailsBreadcrumbs(
          selectedPoll?.account?.title || "Poll Details",
          handleBackToHome,
          handleViewPolls
        );
      default:
        return getHomeBreadcrumbs(handleBackToHome);
    }
  };

  if (!publicKey) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold text-white mb-4">
          Connect Your Wallet
        </h1>
        <p className="text-gray-400 mb-6">
          Please connect your Solana wallet to access the voting application
        </p>
        <div className="text-sm text-gray-500">
          We recommend using Phantom, Solflare, or another Solana wallet
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumbs items={getBreadcrumbs()} />
        </div>

        {/* Main Content */}
        {renderContent()}
      </div>
    </div>
  );
};
