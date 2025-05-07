"use client";

interface DividerBlockProps {
  properties: {
    color: string;
    thickness: string;
    style: string;
    width: string;
    padding: string;
  };
  isSelected: boolean;
}

export default function DividerBlock({
  properties,
  isSelected
}: DividerBlockProps) {
  // Container style
  const containerStyle = {
    padding: properties.padding,
  };

  // Divider style
  const dividerStyle = {
    borderTop: `${properties.thickness} ${properties.style} ${properties.color}`,
    width: properties.width,
    margin: '0 auto',
  };

  return (
    <div style={containerStyle}>
      <div style={dividerStyle}></div>
      {isSelected && (
        <div className="mt-1 text-xs text-blue-500">
          Divider settings can be changed in the properties panel
        </div>
      )}
    </div>
  );
}
