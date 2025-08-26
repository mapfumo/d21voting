"use client";

import { FC, useState } from "react";
import { Poll } from "../lib/types";

interface PollListProps {
  polls: Poll[];
  onPollUpdated: () => void;
  onPollSelected: (poll: Poll, viewMode?: "details" | "results") => void;
  onPollDeleted: (pollId: string) => void;
}

export const PollList: FC<PollListProps> = ({
  polls,
  onPollUpdated,
  onPollSelected,
  onPollDeleted,
}) => {
  const [pollToDelete, setPollToDelete] = useState<string | null>(null);

  // Debug logging for each poll
  if (polls && polls.length > 0) {
    polls.forEach((poll, index) => {
      if (poll && poll.publicKey) {
        console.log(`🔍 Poll ${index} data:`, {
          publicKey: poll.publicKey,
          title: poll.account?.title,
          candidateCount: poll.account?.candidateCount,
          candidates: poll.candidates,
          candidatesLength: poll.candidates?.length || 0,
          hasBlockchainData: !!poll.publicKey && poll.publicKey !== "undefined",
        });
      } else {
        console.log(
          `⚠️ Poll ${index} is undefined or missing publicKey:`,
          poll
        );
      }
    });
  }

  const handleDeleteClick = (pollId: string) => {
    setPollToDelete(pollId);
  };

  const handleConfirmDelete = () => {
    if (pollToDelete) {
      onPollDeleted(pollToDelete);
      setPollToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setPollToDelete(null);
  };

  if (polls.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">
          No polls found. Create your first poll to get started!
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          🏠 Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map((poll, index) => (
        <div
          key={poll.publicKey}
          className="border border-gray-600 rounded-lg p-4 hover:shadow-lg transition-shadow bg-gray-700"
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-lg font-semibold text-white">
              {poll.account.title}
            </h4>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                poll.account.isOpen
                  ? "bg-green-900 text-green-200"
                  : "bg-red-900 text-red-200"
              }`}
            >
              {poll.account.isOpen ? "Open" : "Closed"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mb-3">
            <div>
              <span className="font-medium">Candidates:</span>{" "}
              {poll.account.candidateCount}/{poll.account.maxCandidates}
            </div>
            <div>
              <span className="font-medium">Votes per voter:</span>{" "}
              {poll.account.maxVotesPerVoter}
            </div>
          </div>

          {poll.account.voteCounts.length > 0 && (
            <div className="mb-3">
              <span className="font-medium text-sm text-gray-200">
                Vote Distribution:
              </span>
              <div className="flex gap-2 mt-1 flex-wrap">
                {poll.account.voteCounts.map((count, i) => {
                  // Get the actual candidate name from blockchain data
                  const candidate = poll.candidates?.find(
                    (c) => c.account.index === i
                  );
                  const candidateName = candidate
                    ? candidate.account.name
                    : `Candidate ${i + 1}`;

                  // Debug logging to see what blockchain data we have
                  console.log(`🔍 Poll ${poll.publicKey} - Vote ${i}:`, {
                    count,
                    candidate,
                    candidateName,
                    allCandidates: poll.candidates,
                    candidateCount: poll.account.candidateCount,
                    hasBlockchainData:
                      !!poll.candidates && poll.candidates.length > 0,
                  });

                  return (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs"
                      title={`${candidateName}: ${count} votes`}
                    >
                      {candidateName}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => onPollSelected(poll, "details")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              View Details
            </button>
            {poll.account.isOpen && (
              <button
                onClick={() => onPollSelected(poll, "details")}
                className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
              >
                Vote
              </button>
            )}
            <button
              onClick={() => onPollSelected(poll, "results")}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              View Results
            </button>
            <button
              onClick={() => handleDeleteClick(poll.publicKey)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* Delete Confirmation Modal */}
      {pollToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">
              Delete Poll
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this poll? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex-1"
              >
                Delete Poll
              </button>
              <button
                onClick={handleCancelDelete}
                className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
