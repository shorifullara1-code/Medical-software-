import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string;
  format?: 'CODE128' | 'CODE39' | 'EAN13';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  textMargin?: number;
  className?: string;
  background?: string;
  lineColor?: string;
  margin?: number;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 1.8,
  height = 50,
  displayValue = true,
  fontSize = 12,
  textMargin = 4,
  className = '',
  background = '#ffffff',
  lineColor = '#000000',
  margin = 14,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      const cleanValue = String(value).trim();
      JsBarcode(svgRef.current, cleanValue, {
        format,
        width: Math.max(width, 1.6),
        height: Math.max(height, 46),
        displayValue,
        font: 'JetBrains Mono, monospace',
        fontOptions: 'bold',
        fontSize,
        textMargin,
        background: background || '#ffffff',
        lineColor: lineColor || '#000000',
        margin: Math.max(margin, 12),
      });

      // Ensure SVG maintains exact un-stretched barcode proportions for laser & camera scanners
      const svg = svgRef.current;
      if (svg) {
        svg.classList.add('barcode-svg');
        const wAttr = svg.getAttribute('width');
        const hAttr = svg.getAttribute('height');
        if (wAttr && hAttr) {
          const numW = parseFloat(wAttr);
          const numH = parseFloat(hAttr);
          if (numW > 0 && numH > 0) {
            svg.setAttribute('viewBox', `0 0 ${numW} ${numH}`);
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            // Maintain exact 1:1 pixel width up to 100% parent container - NEVER stretch beyond native size
            svg.style.width = `${numW}px`;
            svg.style.maxWidth = '100%';
            svg.style.height = `${numH}px`;
            svg.style.display = 'block';
            svg.style.margin = '0 auto';
          }
        }

        // Apply crisp edges to all rect elements
        const rects = svg.querySelectorAll('rect');
        rects.forEach((r) => {
          r.setAttribute('shape-rendering', 'crispEdges');
        });
      }
    } catch (err) {
      console.warn('Barcode generation warning:', err);
    }
  }, [value, format, width, height, displayValue, fontSize, textMargin, background, lineColor, margin]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center justify-center bg-white rounded-lg p-2 ${className}`}>
      <svg
        ref={svgRef}
        className="barcode-svg block select-none overflow-visible"
        style={{
          shapeRendering: 'crispEdges',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};


