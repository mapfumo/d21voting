import React from "react";
import { DashboardStatsProps } from "../../lib/types";

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  polls,
  className = "",
}) => {
  const stats = React.useMemo(() => {
    const totalPolls = polls.length;
    const openPolls = polls.filter((poll) => poll.account.isOpen).length;
    const closedPolls = totalPolls - openPolls;
    const totalCandidates = polls.reduce(
      (sum, poll) => sum + (poll.account.candidateCount || 0),
      0
    );
    const totalVotes = polls.reduce((sum, poll) => {
      const voteCounts = poll.account.voteCounts || [];
      return (
        sum +
        voteCounts.reduce((vSum: number, count: number) => vSum + count, 0)
      );
    }, 0);

    const averageCandidatesPerPoll =
      totalPolls > 0 ? (totalCandidates / totalPolls).toFixed(1) : "0";
    const averageVotesPerPoll =
      totalPolls > 0 ? (totalVotes / totalPolls).toFixed(1) : "0";

    const mostPopularPoll = polls.reduce((mostPopular, poll) => {
      const pollVotes = (poll.account.voteCounts || []).reduce(
        (sum: number, count: number) => sum + count,
        0
      );
      const mostVotes = (mostPopular?.account.voteCounts || []).reduce(
        (sum: number, count: number) => sum + count,
        0
      );
      return pollVotes > mostVotes ? poll : mostPopular;
    }, null);

    return {
      totalPolls,
      openPolls,
      closedPolls,
      totalCandidates,
      totalVotes,
      averageCandidatesPerPoll,
      averageVotesPerPoll,
      mostPopularPoll: mostPopularPoll?.account.title || "None",
    };
  }, [polls]);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: string;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div className={`bg-gray-700 rounded-lg p-4 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          📊 Poll Dashboard
        </h2>
        <p className="text-gray-400">Overview of your voting ecosystem</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Polls"
          value={stats.totalPolls}
          icon="📊"
          color="border-blue-500"
        />
        <StatCard
          title="Open Polls"
          value={stats.openPolls}
          icon="🟢"
          color="border-green-500"
        />
        <StatCard
          title="Total Candidates"
          value={stats.totalCandidates}
          icon="👥"
          color="border-purple-500"
        />
        <StatCard
          title="Total Votes"
          value={stats.totalVotes}
          icon="🗳️"
          color="border-yellow-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">📈 Averages</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Candidates per poll:</span>
              <span className="text-white font-medium">
                {stats.averageCandidatesPerPoll}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Votes per poll:</span>
              <span className="text-white font-medium">
                {stats.averageVotesPerPoll}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">
            🏆 Most Popular
          </h3>
          <div className="text-center">
            <div className="text-4xl mb-2">👑</div>
            <p
              className="text-white font-medium truncate"
              title={stats.mostPopularPoll}
            >
              {stats.mostPopularPoll}
            </p>
          </div>
        </div>
      </div>

      {/* Poll Status Distribution */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">
          📊 Poll Status Distribution
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Open Polls</span>
              <span className="text-white">{stats.openPolls}</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${stats.totalPolls > 0 ? (stats.openPolls / stats.totalPolls) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Closed Polls</span>
              <span className="text-white">{stats.closedPolls}</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${stats.totalPolls > 0 ? (stats.closedPolls / stats.totalPolls) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
