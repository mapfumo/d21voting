import React, { useState, useMemo } from "react";

interface SearchAndFilterProps {
  polls: any[];
  onFilteredPollsChange: (filteredPolls: any[]) => void;
  className?: string;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  polls,
  onFilteredPollsChange,
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(
    "all"
  );
  const [sortBy, setSortBy] = useState<
    "title" | "date" | "candidates" | "votes"
  >("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredAndSortedPolls = useMemo(() => {
    let filtered = polls.filter((poll) => {
      const matchesSearch = poll.account.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "open" && poll.account.isOpen) ||
        (statusFilter === "closed" && !poll.account.isOpen);

      return matchesSearch && matchesStatus;
    });

    // Sort polls
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "title":
          aValue = a.account.title.toLowerCase();
          bValue = b.account.title.toLowerCase();
          break;
        case "date":
          aValue = a.account.pollId || 0;
          bValue = b.account.pollId || 0;
          break;
        case "candidates":
          aValue = a.account.candidateCount || 0;
          bValue = b.account.candidateCount || 0;
          break;
        case "votes":
          aValue = (a.account.voteCounts || []).reduce(
            (sum: number, count: number) => sum + count,
            0
          );
          bValue = (b.account.voteCounts || []).reduce(
            (sum: number, count: number) => sum + count,
            0
          );
          break;
        default:
          aValue = a.account.title.toLowerCase();
          bValue = b.account.title.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    onFilteredPollsChange(filtered);
    return filtered;
  }, [
    polls,
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    onFilteredPollsChange,
  ]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search polls..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-300">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "open" | "closed")
            }
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-300">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as "title" | "date" | "candidates" | "votes"
              )
            }
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="title">Title</option>
            <option value="date">Date</option>
            <option value="candidates">Candidates</option>
            <option value="votes">Votes</option>
          </select>
        </div>

        {/* Sort Order */}
        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
        >
          {sortOrder === "asc" ? "↑" : "↓"}
        </button>

        {/* Results Count */}
        <div className="text-sm text-gray-400 ml-auto">
          {filteredAndSortedPolls.length} of {polls.length} polls
        </div>
      </div>
    </div>
  );
};
