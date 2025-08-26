import React, { useState } from "react";
import {
  PollSkeleton,
  CandidateSkeleton,
  ButtonSkeleton,
} from "./ui/SkeletonLoader";
import { ProgressBar, TransactionProgress } from "./ui/ProgressBar";
import { SearchAndFilter } from "./ui/SearchAndFilter";
import {
  Breadcrumbs,
  getHomeBreadcrumbs,
  getPollListBreadcrumbs,
} from "./ui/Breadcrumbs";
import { DashboardStats } from "./ui/DashboardStats";
import { EnhancedButton, ActionButton, IconButton } from "./ui/EnhancedButton";
import { TransactionFeeEstimator } from "./ui/TransactionFeeEstimator";
import { Poll } from "../lib/types";
import { toast } from "react-hot-toast";

// Mock data for demo
const mockPolls: Poll[] = [
  {
    publicKey: "poll1",
    account: {
      title: "Favorite Programming Language",
      isOpen: true,
      maxVotesPerVoter: 3,
      maxCandidates: 5,
      candidateCount: 4,
      voteCounts: [15, 12, 8, 5],
      authority: "user1",
      pollId: "1",
    },
    candidates: [],
  },
  {
    publicKey: "poll2",
    account: {
      title: "Best Pizza Topping",
      isOpen: false,
      maxVotesPerVoter: 2,
      maxCandidates: 6,
      candidateCount: 6,
      voteCounts: [25, 18, 12, 10, 8, 5],
      authority: "user2",
      pollId: "2",
    },
    candidates: [],
  },
];

export const UXDemo: React.FC = () => {
  const [filteredPolls, setFilteredPolls] = useState(mockPolls);
  const [progressStep, setProgressStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleHomeClick = () => console.log("Home clicked");
  const handlePollsClick = () => console.log("Polls clicked");

  const simulateProgress = () => {
    setProgressStep(1);
    const interval = setInterval(() => {
      setProgressStep((prev) => {
        if (prev >= 4) {
          clearInterval(interval);
          return 4;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🎨 UX Improvements Demo</h1>
          <p className="text-xl text-gray-400">
            Showcasing the enhanced user experience components
          </p>
        </div>

        {/* Breadcrumbs Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">🧭 Navigation & Breadcrumbs</h2>
          <div className="bg-gray-700 p-6 rounded-lg">
            <Breadcrumbs items={getHomeBreadcrumbs(handleHomeClick)} />
            <div className="mt-4">
              <Breadcrumbs items={getPollListBreadcrumbs(handleHomeClick)} />
            </div>
          </div>
        </section>

        {/* Dashboard Stats Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">📊 Dashboard Statistics</h2>
          <DashboardStats polls={mockPolls} />
        </section>

        {/* Search and Filter Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">🔍 Search & Filter</h2>
          <div className="bg-gray-700 p-6 rounded-lg">
            <SearchAndFilter
              polls={mockPolls}
              onFilterChange={setFilteredPolls}
            />
            <div className="mt-4 text-sm text-gray-400">
              Filtered results: {filteredPolls.length} polls
            </div>
          </div>
        </section>

        {/* Enhanced Buttons Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">🎯 Enhanced Buttons</h2>
          <div className="bg-gray-700 p-6 rounded-lg space-y-4">
            <div className="flex flex-wrap gap-4">
              <EnhancedButton variant="primary" icon="🚀">
                Primary Button
              </EnhancedButton>
              <EnhancedButton variant="success" icon="✅">
                Success Button
              </EnhancedButton>
              <EnhancedButton variant="danger" icon="🗑️">
                Danger Button
              </EnhancedButton>
              <EnhancedButton variant="warning" icon="⚠️">
                Warning Button
              </EnhancedButton>
              <EnhancedButton variant="ghost" icon="👻">
                Ghost Button
              </EnhancedButton>
            </div>

            <div className="flex flex-wrap gap-4">
              <ActionButton action="create" icon="➕">
                Create Poll
              </ActionButton>
              <ActionButton action="edit" icon="✏️">
                Edit Poll
              </ActionButton>
              <ActionButton action="delete" icon="🗑️">
                Delete Poll
              </ActionButton>
              <ActionButton action="vote" icon="🗳️">
                Cast Vote
              </ActionButton>
            </div>

            <div className="flex flex-wrap gap-4">
              <IconButton icon="🏠" size="sm">
                Home
              </IconButton>
              <IconButton icon="📊" size="md">
                Polls
              </IconButton>
              <IconButton icon="➕" size="lg">
                Create
              </IconButton>
            </div>

            <div className="flex flex-wrap gap-4">
              <EnhancedButton loading={true}>Loading Button</EnhancedButton>
              <EnhancedButton disabled={true}>Disabled Button</EnhancedButton>
              <EnhancedButton fullWidth>Full Width Button</EnhancedButton>
            </div>
          </div>
        </section>

        {/* Skeleton Loaders Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">💀 Skeleton Loaders</h2>
          <div className="bg-gray-700 p-6 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Poll Skeleton</h3>
                <PollSkeleton />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Candidate Skeleton
                </h3>
                <CandidateSkeleton />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Button Skeleton</h3>
              <ButtonSkeleton />
            </div>
            <button
              onClick={simulateLoading}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              {loading ? "Loading..." : "Simulate Loading"}
            </button>
            {loading && (
              <div className="space-y-4">
                <PollSkeleton />
                <PollSkeleton />
                <PollSkeleton />
              </div>
            )}
          </div>
        </section>

        {/* Progress Bars Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">📈 Progress Bars</h2>
          <div className="bg-gray-700 p-6 rounded-lg space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Simple Progress Bar
              </h3>
              <ProgressBar progress={75} status="Processing transaction..." />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Transaction Progress
              </h3>
              <TransactionProgress
                step={progressStep}
                totalSteps={4}
                currentStep={`Step ${progressStep} of 4`}
                steps={[
                  "Preparing transaction",
                  "Signing with wallet",
                  "Sending to blockchain",
                  "Confirming transaction",
                ]}
              />
              <button
                onClick={simulateProgress}
                className="mt-4 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Simulate Transaction
              </button>
            </div>
          </div>
        </section>

        {/* Transaction Fee Estimator Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">💰 Transaction Fee Estimator</h2>
          <div className="bg-gray-700 p-6 rounded-lg">
            <p className="text-gray-400 mb-4">
              Note: This component requires a real Solana connection and
              transaction to work properly.
            </p>
            <div className="p-4 bg-gray-600 rounded border-2 border-dashed border-gray-500">
              <p className="text-center text-gray-400">
                Transaction Fee Estimator Component
              </p>
              <p className="text-center text-sm text-gray-500 mt-2">
                Would show estimated fees here when connected to Solana
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">🎮 Interactive Demo</h2>
          <div className="bg-gray-700 p-6 rounded-lg">
            <p className="text-gray-400 mb-4">
              Try interacting with the components above to see the enhanced UX
              in action!
            </p>
            <div className="flex flex-wrap gap-4">
              <EnhancedButton
                onClick={() => alert("Button clicked!")}
                variant="primary"
                icon="🎉"
              >
                Click Me!
              </EnhancedButton>
              <EnhancedButton
                onClick={() => {
                  toast.success("Success notification!");
                }}
                variant="success"
                icon="✅"
              >
                Show Success
              </EnhancedButton>
            </div>
          </div>
        </section>

        {/* Features Summary */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">✨ Features Implemented</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "🎨 Skeleton loaders for better perceived performance",
              "📊 Dashboard with poll statistics and analytics",
              "🔍 Advanced search and filtering capabilities",
              "🧭 Breadcrumb navigation for better UX",
              "🎯 Enhanced buttons with hover effects and micro-interactions",
              "📈 Progress bars for transaction status",
              "💰 Transaction fee estimation",
              "📱 Responsive design for all screen sizes",
              "🎭 Loading states and feedback systems",
              "🔧 Consistent component architecture",
            ].map((feature, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-300">{feature}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
