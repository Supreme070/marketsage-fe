"use client";

interface TextBlockProps {
  content: string;
  properties: {
    align: string;
    color: string;
    fontSize: string;
    lineHeight: string;
    padding: string;
  };
  onUpdateContent: (content: string) => void;
  isSelected: boolean;
}

export default function TextBlock({
  content,
  properties,
  onUpdateContent,
  isSelected
}: TextBlockProps) {
  // Simple text block
  const style = {
    color: properties.color,
    fontSize: properties.fontSize,
    lineHeight: properties.lineHeight,
    padding: properties.padding,
    textAlign: properties.align as any,
  };

  const handleClick = () => {
    if (isSelected) {
      const newContent = prompt("Enter text content:", content);
      if (newContent !== null) {
        onUpdateContent(newContent);
      }
    }
  };

  return (
    <div onClick={handleClick} style={style}>
      <p>{content}</p>
      {isSelected && (
        <div className="mt-1 text-xs text-blue-500">
          Click to edit text content
        </div>
      )}
    </div>
  );
}
