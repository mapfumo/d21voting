import React from "react";

interface EnhancedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: "left" | "right";
  className?: string;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  className = "",
  type = "button",
  fullWidth = false,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transform hover:scale-105 active:scale-95 disabled:transform-none disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white shadow-lg hover:shadow-xl",
    secondary:
      "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white shadow-lg hover:shadow-xl",
    success:
      "bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white shadow-lg hover:shadow-xl",
    danger:
      "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-lg hover:shadow-xl",
    warning:
      "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white shadow-lg hover:shadow-xl",
    ghost:
      "bg-transparent hover:bg-gray-700 focus:ring-gray-500 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const widthClasses = fullWidth ? "w-full" : "";

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`;

  const renderIcon = () => {
    if (!icon) return null;

    const iconElement = (
      <span
        className={`${size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base"}`}
      >
        {icon}
      </span>
    );

    if (iconPosition === "right") {
      return <span className="ml-2">{iconElement}</span>;
    }

    return <span className="mr-2">{iconElement}</span>;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      );
    }

    return (
      <>
        {iconPosition === "left" && renderIcon()}
        {children}
        {iconPosition === "right" && renderIcon()}
      </>
    );
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
    >
      {renderContent()}
    </button>
  );
};

// Specialized button variants for common use cases
export const ActionButton: React.FC<
  Omit<EnhancedButtonProps, "variant"> & { action: string }
> = ({ action, children, ...props }) => {
  const getVariant = (action: string) => {
    switch (action) {
      case "create":
        return "success";
      case "edit":
        return "primary";
      case "delete":
        return "danger";
      case "close":
        return "warning";
      case "vote":
        return "success";
      case "view":
        return "secondary";
      default:
        return "primary";
    }
  };

  return (
    <EnhancedButton variant={getVariant(action)} {...props}>
      {children}
    </EnhancedButton>
  );
};

export const IconButton: React.FC<
  Omit<EnhancedButtonProps, "icon" | "iconPosition"> & { icon: string }
> = ({ icon, children, ...props }) => (
  <EnhancedButton icon={icon} iconPosition="left" {...props}>
    {children}
  </EnhancedButton>
);
