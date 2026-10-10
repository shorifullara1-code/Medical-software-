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
  width = 1.5,
  height = 44,
  displayValue = true,
  fontSize = 11,
  textMargin = 3,
  className = '',
  background = '#ffffff',
  lineColor = '#000000',
  margin = 8,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      const cleanValue = String(value).trim();
      JsBarcode(svgRef.current, cleanValue, {
        format,
        width: Math.max(width, 1.4),
        height: Math.max(height, 40),
        displayValue,
        font: 'JetBrains Mono, monospace',
        fontOptions: 'bold',
        fontSize,
        textMargin,
        background: background || '#ffffff',
        lineColor: lineColor || '#000000',
        margin: Math.max(margin, 6),
      });

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
            svg.style.maxWidth = '100%';
            svg.style.height = 'auto';
            svg.style.display = 'block';
            svg.style.margin = '0 auto';
          }
        }

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


