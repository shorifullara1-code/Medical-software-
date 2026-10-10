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
 * Ultra-Fast & Rock-Solid Hybrid Scanner Engine
 * 1. Runs Html5Qrcode (ZXing) with full-frame scanning (no restrictive qrbox cropping)
 * 2. Adds hardware-accelerated native BarcodeDetector loop on live video element
 * 3. Enforces strict concurrency locking (isDetecting mutex) so camera never freezes
 * 4. Dual-mode failover across mobile rear camera, front camera, laptop webcams
 */
export class FastBarcodeEngine {
  private containerId: string;
  private onScanSuccess: (text: string) => void;
  private html5QrCode: Html5Qrcode | null = null;
  private nativeDetector: any = null;
  private accelIntervalId: number | null = null;
  private isScanning: boolean = false;
  private isDetecting: boolean = false;
  private lastScannedText: string = '';
  private lastScanTime: number = 0;
  public torchSupported: boolean = false;
  public isTorchOn: boolean = false;
  private activeMediaStream: MediaStream | null = null;

  constructor(options: FastScannerOptions) {
    this.containerId = options.containerId;
    this.onScanSuccess = options.onScanSuccess;
  }

  public resetScannedMemory() {
    this.lastScannedText = '';
    this.lastScanTime = 0;
  }

  public async start(): Promise<void> {
    this.isScanning = true;
    this.resetScannedMemory();

    const container = document.getElementById(this.containerId);
    if (!container) throw new Error(`Container #${this.containerId} not found`);
    container.innerHTML = '';

    // Initialize native BarcodeDetector if available
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
        this.nativeDetector = new window.BarcodeDetector({ formats });
      } catch (e) {
        console.warn('Native BarcodeDetector unavailable, relying on ZXing:', e);
        this.nativeDetector = null;
      }
    }

    // Supported formats for ZXing
    const formatsToSupport = [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
    ];

    this.html5QrCode = new Html5Qrcode(this.containerId, {
      formatsToSupport,
      verbose: false,
    });

    const qrConfig: any = {
      fps: 15,
      // Omit qrbox to scan full camera frame across computer screens and paper
      disableFlip: false,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: false, // Use our own serialized native accelerator instead
      },
    };

    // Try starting camera with environment (back) camera first
    let started = false;
    try {
      await this.html5QrCode.start(
        { facingMode: 'environment' },
        qrConfig,
        (decodedText) => this.triggerSuccess(decodedText),
        () => {}
      );
      started = true;
    } catch (errEnv) {
      console.warn('Could not open environment camera, trying fallback camera...', errEnv);
      try {
        await this.html5QrCode.start(
          { facingMode: 'user' },
          qrConfig,
          (decodedText) => this.triggerSuccess(decodedText),
          () => {}
        );
        started = true;
      } catch (errUser) {
        // Last attempt: try first available camera ID
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            await this.html5QrCode.start(
              cameras[0].id,
              qrConfig,
              (decodedText) => this.triggerSuccess(decodedText),
              () => {}
            );
            started = true;
          }
        } catch (errFinal) {
          throw errFinal || errUser || errEnv;
        }
      }
    }

    if (!started) {
      throw new Error('Camera could not be started');
    }

    // Camera is running; inspect video element and setup torch & native accelerator
    const video = container.querySelector('video') as HTMLVideoElement | null;
    if (video) {
      video.style.objectFit = 'contain';
      video.style.backgroundColor = '#000000';
      if (video.srcObject instanceof MediaStream) {
        this.activeMediaStream = video.srcObject;
        const track = this.activeMediaStream.getVideoTracks()[0];
        if (track) {
          const caps: any = track.getCapabilities?.() || {};
          if (caps.torch) {
            this.torchSupported = true;
          }
        }
      }
    }

    // Start serialized native accelerator if available
    if (this.nativeDetector) {
      this.startNativeAccelerator(container);
    }
  }

  /**
   * Serialized Native GPU BarcodeDetector loop
   * Runs concurrently alongside ZXing without blocking or crashing Android Chrome
   */
  private startNativeAccelerator(container: HTMLElement) {
    if (this.accelIntervalId) {
      window.clearInterval(this.accelIntervalId);
      this.accelIntervalId = null;
    }

    this.accelIntervalId = window.setInterval(async () => {
      if (!this.isScanning || this.isDetecting || !this.nativeDetector) return;

      const video = container.querySelector('video') as HTMLVideoElement | null;
      if (!video || video.readyState < 2) return;

      this.isDetecting = true;
      try {
        const barcodes = await this.nativeDetector.detect(video);
        if (barcodes && barcodes.length > 0) {
          for (const b of barcodes) {
            if (b.rawValue && b.rawValue.trim()) {
              this.triggerSuccess(b.rawValue.trim());
              break;
            }
          }
        }
      } catch (e) {
        // Normal frame skip
      } finally {
        this.isDetecting = false;
      }
    }, 70); // ~14 FPS check, silky smooth and rock-solid
  }

  /**
   * Triggers scan success with short debounce to allow consecutive scans
   */
  private triggerSuccess(text: string) {
    if (!text || !text.trim()) return;
    const clean = text.trim();
    const now = Date.now();

    // Prevent duplicate rapid firing within 500ms
    if (clean === this.lastScannedText && now - this.lastScanTime < 500) {
      return;
    }
    this.lastScannedText = clean;
    this.lastScanTime = now;

    setTimeout(() => {
      if (this.lastScannedText === clean) {
        this.lastScannedText = '';
      }
    }, 700);

    this.onScanSuccess(clean);
  }

  /**
   * Toggle Torch / Flashlight
   */
  public async toggleTorch(): Promise<boolean> {
    if (!this.activeMediaStream) return false;
    const track = this.activeMediaStream.getVideoTracks()[0];
    if (!track) return false;

    try {
      this.isTorchOn = !this.isTorchOn;
      await track.applyConstraints({
        advanced: [{ torch: this.isTorchOn }] as any,
      });
      return this.isTorchOn;
    } catch (e) {
      console.warn('Torch toggle error:', e);
      return false;
    }
  }

  /**
   * Cleanly stop camera and all accelerator intervals
   */
  public async stop(): Promise<void> {
    this.isScanning = false;
    this.isDetecting = false;

    if (this.accelIntervalId) {
      window.clearInterval(this.accelIntervalId);
      this.accelIntervalId = null;
    }

    if (this.html5QrCode) {
      try {
        if (this.html5QrCode.isScanning) {
          await this.html5QrCode.stop();
        }
        await this.html5QrCode.clear();
      } catch (e) {
        console.warn('html5QrCode stop warning:', e);
      }
      this.html5QrCode = null;
    }

    if (this.activeMediaStream) {
      try {
        this.activeMediaStream.getTracks().forEach((t) => t.stop());
      } catch (e) {
        // Ignore
      }
      this.activeMediaStream = null;
    }

    this.isTorchOn = false;
    this.torchSupported = false;

    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
    }
  }
}
