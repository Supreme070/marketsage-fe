"use client";

import { Text } from "lucide-react";
import { Image } from "lucide-react";
import { Layout2 } from "lucide-react";
import { Grid2X2 } from "lucide-react";
import { SeparatorHorizontal } from "lucide-react";
import { FileText } from "lucide-react";
import { Button as ButtonIcon } from "lucide-react";
import { ListOrdered } from "lucide-react";
import { ListTree } from "lucide-react";
import { SquareDashedBottom } from "lucide-react";
import { Paintbrush } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface EmailBlocksProps {
  addBlock: (type: string, defaultContent: any, defaultProperties: any) => void;
}

export default function EmailBlocks({ addBlock }: EmailBlocksProps) {
  // Define the blocks
  const contentBlocks = [
    {
      type: "heading",
      name: "Heading",
      icon: <Text className="h-4 w-4" />,
      defaultContent: "Your Heading Here",
      defaultProperties: {
        level: "h1",
        align: "center",
        color: "#000000",
        fontSize: "24px",
        fontWeight: "bold",
        padding: "10px 0"
      }
    },
    {
      type: "text",
      name: "Text Block",
      icon: <FileText className="h-4 w-4" />,
      defaultContent: "Your text content goes here. Edit this text to add your own content.",
      defaultProperties: {
        align: "left",
        color: "#000000",
        fontSize: "16px",
        lineHeight: "1.5",
        padding: "10px 0"
      }
    },
    {
      type: "image",
      name: "Image",
      icon: <Image className="h-4 w-4" />,
      defaultContent: {
        src: "https://via.placeholder.com/600x200",
        alt: "Placeholder Image"
      },
      defaultProperties: {
        align: "center",
        width: "100%",
        padding: "10px 0",
        link: "",
        borderRadius: "0"
      }
    },
    {
      type: "button",
      name: "Button",
      icon: <ButtonIcon className="h-4 w-4" />,
      defaultContent: {
        text: "Click Here",
        link: "#"
      },
      defaultProperties: {
        align: "center",
        backgroundColor: "#007bff",
        color: "#ffffff",
        fontSize: "16px",
        fontWeight: "bold",
        padding: "12px 20px",
        borderRadius: "4px",
        width: "auto"
      }
    },
    {
      type: "divider",
      name: "Divider",
      icon: <SeparatorHorizontal className="h-4 w-4" />,
      defaultContent: null,
      defaultProperties: {
        color: "#e0e0e0",
        thickness: "1px",
        style: "solid",
        width: "100%",
        padding: "20px 0"
      }
    },
    {
      type: "spacer",
      name: "Spacer",
      icon: <SquareDashedBottom className="h-4 w-4" />,
      defaultContent: null,
      defaultProperties: {
        height: "30px"
      }
    }
  ];

  const layoutBlocks = [
    {
      type: "oneColumn",
      name: "One Column",
      icon: <Layout2 className="h-4 w-4" />,
      defaultContent: {
        column1: []
      },
      defaultProperties: {
        backgroundColor: "transparent",
        padding: "10px",
        border: "none",
        borderRadius: "0"
      }
    },
    {
      type: "twoColumn",
      name: "Two Columns",
      icon: <Grid2X2 className="h-4 w-4" />,
      defaultContent: {
        column1: [],
        column2: []
      },
      defaultProperties: {
        backgroundColor: "transparent",
        padding: "10px",
        border: "none",
        borderRadius: "0",
        columnGap: "20px",
        ratio: "1:1"
      }
    }
  ];

  const specialBlocks = [
    {
      type: "bulletList",
      name: "Bullet List",
      icon: <ListTree className="h-4 w-4" />,
      defaultContent: {
        items: [
          "First item",
          "Second item",
          "Third item"
        ]
      },
      defaultProperties: {
        bulletColor: "#000000",
        textColor: "#000000",
        fontSize: "16px",
        padding: "10px 0"
      }
    },
    {
      type: "numberedList",
      name: "Numbered List",
      icon: <ListOrdered className="h-4 w-4" />,
      defaultContent: {
        items: [
          "First item",
          "Second item",
          "Third item"
        ]
      },
      defaultProperties: {
        numberColor: "#000000",
        textColor: "#000000",
        fontSize: "16px",
        padding: "10px 0"
      }
    },
    {
      type: "socialIcons",
      name: "Social Icons",
      icon: <Paintbrush className="h-4 w-4" />,
      defaultContent: {
        networks: [
          {
            name: "Facebook",
            url: "https://facebook.com",
            enabled: true
          },
          {
            name: "Twitter",
            url: "https://twitter.com",
            enabled: true
          },
          {
            name: "Instagram",
            url: "https://instagram.com",
            enabled: true
          },
          {
            name: "LinkedIn",
            url: "https://linkedin.com",
            enabled: false
          }
        ]
      },
      defaultProperties: {
        iconSize: "32px",
        iconSpacing: "10px",
        align: "center",
        padding: "10px 0",
        iconColor: "#000000",
        iconStyle: "rounded"
      }
    }
  ];

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["content", "layout", "special"]}>
        <AccordionItem value="content">
          <AccordionTrigger>Content Blocks</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {contentBlocks.map((block) => (
                <div
                  key={block.type}
                  className="flex cursor-pointer flex-col items-center rounded-md border border-border p-3 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => addBlock(block.type, block.defaultContent, block.defaultProperties)}
                >
                  <div className="mb-2 rounded-md bg-primary/10 p-2">
                    {block.icon}
                  </div>
                  <span className="text-xs">{block.name}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="layout">
          <AccordionTrigger>Layout Blocks</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {layoutBlocks.map((block) => (
                <div
                  key={block.type}
                  className="flex cursor-pointer flex-col items-center rounded-md border border-border p-3 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => addBlock(block.type, block.defaultContent, block.defaultProperties)}
                >
                  <div className="mb-2 rounded-md bg-blue-500/10 p-2">
                    {block.icon}
                  </div>
                  <span className="text-xs">{block.name}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="special">
          <AccordionTrigger>Special Blocks</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {specialBlocks.map((block) => (
                <div
                  key={block.type}
                  className="flex cursor-pointer flex-col items-center rounded-md border border-border p-3 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => addBlock(block.type, block.defaultContent, block.defaultProperties)}
                >
                  <div className="mb-2 rounded-md bg-orange-500/10 p-2">
                    {block.icon}
                  </div>
                  <span className="text-xs">{block.name}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
