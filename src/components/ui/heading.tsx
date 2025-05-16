import * as React from "react"
import { VariantProps, cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const headingVariants = cva(
  "font-bold text-foreground tracking-tight",
  {
    variants: {
      variant: {
        h1: "text-4xl lg:text-5xl",
        h2: "text-3xl lg:text-4xl",
        h3: "text-2xl lg:text-3xl",
        h4: "text-xl lg:text-2xl"
      },
    },
    defaultVariants: {
      variant: "h1",
    },
  }
)

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const Heading = React.forwardRef<
  HTMLHeadingElement,
  HeadingProps
>(({ className, variant, as: Component = "h1", ...props }, ref) => {
  return React.createElement(
    Component,
    {
      ref,
      className: cn(headingVariants({ variant }), className),
      ...props
    }
  )
})
Heading.displayName = "Heading"

export { Heading, headingVariants } 