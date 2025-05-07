"use client";

interface ButtonBlockProps {
  content: {
    text: string;
    link: string;
  };
  properties: {
    align: string;
    backgroundColor: string;
    color: string;
    fontSize: string;
    fontWeight: string;
    padding: string;
    borderRadius: string;
    width: string;
  };
  onUpdateContent: (content: { text: string; link: string }) => void;
  isSelected: boolean;
}

export default function ButtonBlock({
  content,
  properties,
  onUpdateContent,
  isSelected
}: ButtonBlockProps) {
  // Container style based on alignment
  const containerStyle = {
    textAlign: properties.align as any,
    padding: properties.padding,
  };

  // Button style
  const buttonStyle = {
    backgroundColor: properties.backgroundColor,
    color: properties.color,
    fontSize: properties.fontSize,
    fontWeight: properties.fontWeight,
    padding: properties.padding,
    borderRadius: properties.borderRadius,
    display: 'inline-block',
    textDecoration: 'none',
    cursor: 'pointer',
    width: properties.width === 'auto' ? 'auto' : '100%',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSelected) {
      e.preventDefault();
      const newText = prompt("Enter button text:", content.text);
      if (newText !== null) {
        const newLink = prompt("Enter button link:", content.link);
        if (newLink !== null) {
          onUpdateContent({
            text: newText,
            link: newLink
          });
        }
      }
    }
  };

  return (
    <div style={containerStyle}>
      <a
        href={content.link}
        style={buttonStyle}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content.text}
      </a>
      {isSelected && (
        <div className="mt-1 text-xs text-blue-500">
          Click to edit button
        </div>
      )}
    </div>
  );
}
