import * as React from "react"
import { VariantProps, cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const paragraphVariants = cva(
  "text-foreground",
  {
    variants: {
      variant: {
        default: "leading-7",
        small: "text-sm leading-6",
        large: "text-lg leading-8",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ParagraphProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof paragraphVariants> {}

const Paragraph = React.forwardRef<
  HTMLParagraphElement,
  ParagraphProps
>(({ className, variant, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(paragraphVariants({ variant }), className)}
      {...props}
    />
  )
})
Paragraph.displayName = "Paragraph"

export { Paragraph, paragraphVariants } 