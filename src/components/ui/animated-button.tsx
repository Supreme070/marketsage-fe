"use client";

import React, { forwardRef } from "react";
import { VariantProps, cva } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Button variants
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground focus-visible:ring-primary shadow-lg shadow-primary/20 dark:shadow-primary/10",
        destructive:
          "bg-destructive text-destructive-foreground focus-visible:ring-destructive shadow-lg shadow-destructive/10",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent",
        secondary:
          "bg-secondary text-secondary-foreground focus-visible:ring-secondary shadow-md shadow-secondary/10",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "text-white bg-gradient-to-r from-primary to-secondary shadow-xl shadow-primary/20 dark:shadow-primary/10",
        accent: "bg-accent text-accent-foreground focus-visible:ring-accent shadow-md shadow-accent/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-14 rounded-md px-10 text-lg",
        icon: "h-10 w-10 rounded-md",
      },
      glow: {
        true: "after:content-[''] after:absolute after:inset-0 after:z-[-1] after:opacity-40 after:blur-xl transition-all",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        glow: true,
        className: "after:bg-primary",
      },
      {
        variant: "destructive",
        glow: true,
        className: "after:bg-destructive",
      },
      {
        variant: "gradient",
        glow: true,
        className: "after:bg-gradient-to-r after:from-primary after:to-secondary",
      },
      {
        variant: "accent",
        glow: true,
        className: "after:bg-accent",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: false,
    },
  }
);

// Motion variants for the hover animation
const hoverVariants = {
  initial: {
    y: 0,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
  hover: {
    y: -4,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  tap: {
    y: 0,
    scale: 0.98,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
};

// Add a shimmer effect element for gradient buttons
const Shimmer = () => (
  <span 
    className="absolute inset-0 overflow-hidden rounded-md"
    style={{ transform: "translateX(-100%)" }}
  >
    <motion.span
      className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"
      animate={{ 
        x: ["0%", "100%"],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 5,
        ease: "easeInOut",
      }}
    />
  </span>
);

// Button interface
export interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shimmer?: boolean;
  glowOnHover?: boolean;
}

// Animated Button component
const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    icon, 
    rightIcon, 
    children, 
    shimmer = false, 
    glow = false,
    glowOnHover = false,
    ...props 
  }, ref) => {
    // Add click effect
    const [isClickAnimating, setIsClickAnimating] = React.useState(false);
    
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (props.onMouseDown) {
        props.onMouseDown(e);
      }
      setIsClickAnimating(true);
    };
    
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, glow, className }))}
        ref={ref}
        initial="initial"
        whileHover={isClickAnimating ? "tap" : "hover"}
        whileTap="tap"
        variants={hoverVariants}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 17,
          duration: 0.1 
        }}
        onMouseDown={handleMouseDown}
        onAnimationComplete={() => {
          if (isClickAnimating) {
            setTimeout(() => setIsClickAnimating(false), 100);
          }
        }}
        {...props}
      >
        {/* Shimmer effect */}
        {shimmer && variant !== "outline" && variant !== "ghost" && <Shimmer />}

        {/* Glow on hover effect */}
        {glowOnHover && (
          <span className="absolute inset-0 rounded-md opacity-0 transition-opacity group-hover:opacity-100">
            <span className={`absolute inset-0 rounded-md blur-xl ${
              variant === "default" ? "bg-primary/50" : 
              variant === "destructive" ? "bg-destructive/50" :
              variant === "gradient" ? "bg-gradient-to-r from-primary/50 to-secondary/50" :
              variant === "accent" ? "bg-accent/50" : 
              ""
            }`} />
          </span>
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>
      </motion.button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton, buttonVariants }; 