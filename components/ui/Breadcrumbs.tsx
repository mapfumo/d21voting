import React from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = "",
}) => {
  return (
    <nav
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <svg
              className="h-4 w-4 text-gray-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}

          {item.href ? (
            <a
              href={item.href}
              className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors duration-200"
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </a>
          ) : item.onClick ? (
            <button
              onClick={item.onClick}
              className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded"
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ) : (
            <span className="flex items-center space-x-1 text-white">
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Predefined breadcrumb configurations
export const getHomeBreadcrumbs = (
  onHomeClick: () => void
): BreadcrumbItem[] => [{ label: "Home", icon: "🏠", onClick: onHomeClick }];

export const getPollListBreadcrumbs = (
  onHomeClick: () => void
): BreadcrumbItem[] => [
  { label: "Home", icon: "🏠", onClick: onHomeClick },
  { label: "All Polls", icon: "📊" },
];

export const getPollDetailsBreadcrumbs = (
  pollTitle: string,
  onHomeClick: () => void,
  onPollsClick: () => void
): BreadcrumbItem[] => [
  { label: "Home", icon: "🏠", onClick: onHomeClick },
  { label: "All Polls", icon: "📊", onClick: onPollsClick },
  { label: pollTitle, icon: "📋" },
];

export const getCreatePollBreadcrumbs = (
  onHomeClick: () => void
): BreadcrumbItem[] => [
  { label: "Home", icon: "🏠", onClick: onHomeClick },
  { label: "Create Poll", icon: "➕" },
];
