import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeRendererProps {
  value: string;
  size?: number;
  className?: string;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export const QRCodeRenderer: React.FC<QRCodeRendererProps> = ({
  value,
  size = 64,
  className = '',
  margin = 1,
  color = { dark: '#000000', light: '#ffffff' },
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    try {
      QRCode.toCanvas(canvasRef.current, String(value).trim(), {
        width: size,
        margin: margin,
        color: {
          dark: color.dark || '#000000',
          light: color.light || '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
    } catch (err) {
      console.warn('QR Code generation error:', err);
    }
  }, [value, size, margin, color]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center justify-center bg-white rounded-lg p-1 ${className}`}>
      <canvas
        ref={canvasRef}
        className="block select-none rounded"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};
