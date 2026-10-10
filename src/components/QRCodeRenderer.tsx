import React, { useEffect, useState } from 'react';
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
  size = 80,
  className = '',
  margin = 4,
  color = { dark: '#000000', light: '#ffffff' },
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) {
      setDataUrl('');
      return;
    }

    const cleanValue = String(value).trim();
    // Generate high resolution data URL for ultra-sharp camera readability and print support
    QRCode.toDataURL(cleanValue, {
      width: Math.max(size * 3, 300),
      margin: Math.max(margin, 2),
      color: {
        dark: color.dark || '#000000',
        light: color.light || '#ffffff',
      },
      errorCorrectionLevel: 'H', // High error correction for robust scannability
    })
      .then((url) => {
        setDataUrl(url);
      })
      .catch((err) => {
        console.warn('QR Code generation error:', err);
      });
  }, [value, size, margin, color]);

  if (!value || !dataUrl) return null;

  return (
    <div className={`inline-flex flex-col items-center justify-center bg-white rounded-xl p-1.5 shadow-xs border border-slate-200/80 ${className}`}>
      <img
        src={dataUrl}
        alt={`QR: ${value}`}
        className="block select-none rounded"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          imageRendering: 'crisp-edges',
        }}
      />
    </div>
  );
};
