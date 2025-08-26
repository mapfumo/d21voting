import React from "react";

interface SkeletonLoaderProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = "",
  height = "h-4",
  width = "w-full",
  rounded = "rounded",
}) => {
  return (
    <div
      className={`${height} ${width} ${rounded} bg-gray-600 animate-pulse ${className}`}
    />
  );
};

export const PollSkeleton: React.FC = () => (
  <div className="border border-gray-600 rounded-lg p-4 bg-gray-700 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <SkeletonLoader height="h-6" width="w-3/4" />
      <SkeletonLoader height="h-8" width="w-20" />
    </div>
    <div className="space-y-2 mb-3">
      <SkeletonLoader height="h-4" width="w-1/2" />
      <SkeletonLoader height="h-4" width="w-1/3" />
    </div>
    <div className="flex justify-between items-center">
      <SkeletonLoader height="h-4" width="w-24" />
      <SkeletonLoader height="h-8" width="w-16" />
    </div>
  </div>
);

export const CandidateSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg bg-gray-700 animate-pulse">
    <div className="flex items-center space-x-3">
      <SkeletonLoader height="h-10" width="w-10" rounded="rounded-full" />
      <div>
        <SkeletonLoader height="h-4" width="w-32" />
        <SkeletonLoader height="h-3" width="w-20" />
      </div>
    </div>
    <SkeletonLoader height="h-8" width="w-16" />
  </div>
);

export const ButtonSkeleton: React.FC = () => (
  <SkeletonLoader height="h-10" width="w-24" rounded="rounded-lg" />
);
