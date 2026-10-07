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
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 1.6,
  height = 42,
  displayValue = true,
  fontSize = 12,
  textMargin = 2,
  className = '',
  background = 'transparent',
  lineColor = '#0f172a',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        font: 'JetBrains Mono, monospace',
        fontOptions: 'bold',
        fontSize,
        textMargin,
        background,
        lineColor,
        margin: 2,
      });
    } catch (err) {
      console.warn('Barcode generation warning:', err);
    }
  }, [value, format, width, height, displayValue, fontSize, textMargin, background, lineColor]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto overflow-visible" />
    </div>
  );
};
