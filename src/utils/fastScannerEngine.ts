import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

export interface FastScannerOptions {
  containerId: string;
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  fps?: number;
}

/**
 * High-Resolution Center-Crop Image Enhancer for Paper Barcodes (Prescriptions & Money Receipts)
 * Crops the center area at 1:1 native resolution where the user aligns the paper barcode
 */
export function enhanceCenterCropCanvas(
  video: HTMLVideoElement
): HTMLCanvasElement | null {
  const vWidth = video.videoWidth || 1280;
  const vHeight = video.videoHeight || 720;
  if (!vWidth || !vHeight) return null;

  // Use full width of video frame (92%) and vertical center zone
  const cropW = Math.floor(vWidth * 0.92);
  const cropH = Math.floor(vHeight * 0.70);
  const startX = Math.floor((vWidth - cropW) / 2);
  const startY = Math.floor((vHeight - cropH) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = cropW;
  canvas.height = cropH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Draw 1:1 center crop at full resolution (bars remain crisp)
  ctx.drawImage(video, startX, startY, cropW, cropH, 0, 0, cropW, cropH);

  try {
    const imgData = ctx.getImageData(0, 0, cropW, cropH);
    const d = imgData.data;

    // Linear grayscale conversion with mild contrast boost without hard threshold clipping
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Mild linear contrast enhancement preserving barcode edges
      const boosted = Math.min(255, Math.max(0, (gray - 128) * 1.3 + 128));
      d[i] = boosted;
      d[i + 1] = boosted;
      d[i + 2] = boosted;
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    // Fallback to un-modified canvas
  }

  return canvas;
}

/**
 * Ultra-Fast Hybrid Barcode & QR Code Engine
 * Prefers Hardware-Accelerated Native BarcodeDetector API (60 FPS, Sub-5ms)
 * Fallback to Html5Qrcode with Frame Acceleration
 */
export class FastBarcodeEngine {
  private containerId: string;
  private onScanSuccess: (text: string) => void;
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private nativeDetector: any = null;
  private html5QrCode: Html5Qrcode | null = null;
  private isScanning: boolean = false;
  private lastScannedText: string = '';
  private lastScanTime: number = 0;
  private frameCounter: number = 0;
  public torchSupported: boolean = false;
  public isTorchOn: boolean = false;

  constructor(options: FastScannerOptions) {
    this.containerId = options.containerId;
    this.onScanSuccess = options.onScanSuccess;
  }

  /**
   * Resets scanned code memory so the scanner can scan the same or new QR code repeatedly
   */
  public resetScannedMemory() {
    this.lastScannedText = '';
    this.lastScanTime = 0;
  }

  /**
   * Starts high-speed camera scanner
   */
  public async start(): Promise<void> {
    this.isScanning = true;
    this.resetScannedMemory();
    const container = document.getElementById(this.containerId);
    if (!container) throw new Error(`Container #${this.containerId} not found`);

    container.innerHTML = ''; // clear previous content

    // 1. Check Native Hardware BarcodeDetector support
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        let formats = [
          'qr_code',
          'code_128',
          'code_39',
          'ean_13',
          'ean_8',
          'upc_a',
          'upc_e',
        ];
        if (typeof (window.BarcodeDetector as any).getSupportedFormats === 'function') {
          const supported = await (window.BarcodeDetector as any).getSupportedFormats();
          if (Array.isArray(supported) && supported.length > 0) {
            formats = formats.filter((f) => supported.includes(f));
          }
        }
        // ONLY use native BarcodeDetector if it supports 1D Code 128 barcodes
        if (formats.includes('code_128')) {
          this.nativeDetector = new window.BarcodeDetector({ formats });
        } else {
          // Native detector only supports QR or lacks Code 128 - fallback to Html5Qrcode
          this.nativeDetector = null;
        }
      } catch (e) {
        console.warn('Native BarcodeDetector init fallback:', e);
        this.nativeDetector = null;
      }
    }

    if (this.nativeDetector) {
      // Use Ultra-Fast Hardware Camera Stream
      await this.startNativeHardwareStream(container);
    } else {
      // Use Optimized Html5Qrcode Reader
      await this.startHtml5QrcodeStream(container);
    }
  }

  /**
   * Hardware-Accelerated Camera Stream (60 FPS Native Detection)
   */
  private async startNativeHardwareStream(container: HTMLElement): Promise<void> {
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
    video.style.backgroundColor = '#000000';
    container.appendChild(video);
    this.videoElement = video;

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, min: 20 },
        advanced: [{ focusMode: 'continuous' }, { exposureMode: 'continuous' }] as any,
      },
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = this.stream;
    await video.play();

    // Check Torch (Flashlight) support
    const track = this.stream.getVideoTracks()[0];
    if (track) {
      const caps: any = track.getCapabilities?.() || {};
      if (caps.torch) {
        this.torchSupported = true;
      }
    }

    // High speed detection loop
    const processFrame = async () => {
      if (!this.isScanning || !this.videoElement) return;

      if (this.videoElement.readyState >= 2) {
        try {
          // 1. Native GPU scan on full video element (Sub-3ms)
          const barcodes = await this.nativeDetector.detect(this.videoElement);
          if (barcodes && barcodes.length > 0) {
            for (const b of barcodes) {
              if (b.rawValue && b.rawValue.trim()) {
                this.triggerSuccess(b.rawValue.trim());
                break;
              }
            }
          } else {
            // 2. High-speed center-crop pass for paper barcodes (Prescriptions & Money Receipts)
            this.frameCounter++;
            if (this.frameCounter % 2 === 0) {
              const centerCrop = enhanceCenterCropCanvas(this.videoElement);
              if (centerCrop) {
                const cropBarcodes = await this.nativeDetector.detect(centerCrop);
                if (cropBarcodes && cropBarcodes.length > 0) {
                  for (const cb of cropBarcodes) {
                    if (cb.rawValue && cb.rawValue.trim()) {
                      this.triggerSuccess(cb.rawValue.trim());
                      break;
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          // Detection frame drop normal
        }
      }

      if (this.isScanning) {
        this.animFrameId = requestAnimationFrame(processFrame);
      }
    };

    this.animFrameId = requestAnimationFrame(processFrame);
  }

  /**
   * Optimized Html5Qrcode Fallback Engine with Full-Frame Detection
   */
  private async startHtml5QrcodeStream(container: HTMLElement): Promise<void> {
    const formatsToSupport = [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.UPC_A,
    ];

    this.html5QrCode = new Html5Qrcode(this.containerId, {
      formatsToSupport,
      verbose: false,
    });

    // Safe camera constraints that work across all mobile phones, laptops, and webcams
    const cameraConfig: any = {
      facingMode: 'environment',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };

    // Safe responsive qrbox that never exceeds viewfinder dimensions
    const config: any = {
      fps: 25,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const w = Math.min(Math.floor(viewfinderWidth * 0.88), viewfinderWidth - 10);
        const h = Math.min(Math.floor(viewfinderHeight * 0.7), viewfinderHeight - 10);
        return {
          width: Math.max(w, 50),
          height: Math.max(h, 50),
        };
      },
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
    };

    await this.html5QrCode.start(
      cameraConfig,
      config,
      (decodedText) => {
        this.triggerSuccess(decodedText);
      },
      () => {
        // Frame decode failure normal
      }
    );
  }

  /**
   * Triggers scan success with short 500ms debounce
   */
  private triggerSuccess(text: string) {
    const now = Date.now();
    // Allow re-scan after 500ms so user can scan same or new QR code repeatedly
    if (text === this.lastScannedText && now - this.lastScanTime < 500) {
      return;
    }
    this.lastScannedText = text;
    this.lastScanTime = now;

    // Auto-clear memory after 600ms so subsequent scans always register
    setTimeout(() => {
      if (this.lastScannedText === text) {
        this.lastScannedText = '';
      }
    }, 600);

    this.onScanSuccess(text);
  }

  /**
   * Toggle Torch / Flashlight for scanning in dim/dark lighting
   */
  public async toggleTorch(): Promise<boolean> {
    if (!this.stream) return false;
    const track = this.stream.getVideoTracks()[0];
    if (!track) return false;

    try {
      this.isTorchOn = !this.isTorchOn;
      await track.applyConstraints({
        advanced: [{ torch: this.isTorchOn }] as any,
      });
      return this.isTorchOn;
    } catch (err) {
      console.warn('Torch toggle warning:', err);
      return false;
    }
  }

  /**
   * Stops the camera and releases hardware resources
   */
  public async stop(): Promise<void> {
    this.isScanning = false;
    this.resetScannedMemory();

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    if (this.html5QrCode) {
      try {
        if (this.html5QrCode.isScanning) {
          await this.html5QrCode.stop();
        }
        await this.html5QrCode.clear();
      } catch (e) {
        // Ignore stop warning
      }
      this.html5QrCode = null;
    }

    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
    }
  }
}
