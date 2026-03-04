import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Flashlight, FlashlightOff, RotateCcw, QrCode } from 'lucide-react';

interface QrScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<'loading' | 'scanning' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const id = 'qr-reader-container';
    const scanner = new Html5Qrcode(id);
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras.length) {
          setStatus('error');
          setErrorMsg('لا توجد كاميرا متاحة');
          return;
        }

        // Prefer back camera
        const cam = cameras.find((c) =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('environment')
        ) ?? cameras[cameras.length - 1];

        return scanner.start(
          cam.id,
          {
            fps: 15,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (scanned) return;
            setScanned(true);
            // Extract label code from URL if it's a verify URL
            const match = decodedText.match(/\/verify\/([^/?#]+)/);
            const code = match ? match[1] : decodedText;
            scanner.stop().catch(() => {});
            onScan(code);
          },
          () => { /* ignore individual frame errors */ }
        );
      })
      .then(() => setStatus('scanning'))
      .catch((err) => {
        setStatus('error');
        setErrorMsg(
          err?.message?.includes('Permission')
            ? 'لم يتم منح إذن الكاميرا'
            : 'تعذّر تشغيل الكاميرا'
        );
      });

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const toggleTorch = async () => {
    try {
      if (scannerRef.current) {
        if (torchOn) {
          await (scannerRef.current as any).applyVideoConstraints({ advanced: [{ torch: false }] });
        } else {
          await (scannerRef.current as any).applyVideoConstraints({ advanced: [{ torch: true }] });
        }
        setTorchOn(!torchOn);
      }
    } catch { /* torch not supported */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-safe pt-6 pb-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-white">مسح رمز QR</p>
          <p className="text-xs text-white/60">وجّه الكاميرا نحو الرمز</p>
        </div>
        <button
          onClick={toggleTorch}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
        >
          {torchOn ? <FlashlightOff className="h-5 w-5" /> : <Flashlight className="h-5 w-5" />}
        </button>
      </div>

      {/* Camera feed */}
      <div className="relative flex-1 overflow-hidden">
        {/* Hidden qr reader div — html5-qrcode renders video here */}
        <div
          id="qr-reader-container"
          className="absolute inset-0 [&>video]:h-full [&>video]:w-full [&>video]:object-cover [&_canvas]:hidden [&_img]:hidden"
          style={{ width: '100%', height: '100%' }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Dark corners */}
          <div className="absolute inset-0 bg-black/50" style={{
            maskImage: 'radial-gradient(ellipse 280px 280px at center, transparent 50%, black 51%)',
            WebkitMaskImage: 'radial-gradient(ellipse 280px 280px at center, transparent 50%, black 51%)',
          }} />

          {/* Scan frame */}
          <div className="relative h-64 w-64">
            {/* Corner brackets */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
              <div
                key={corner}
                className={`absolute h-8 w-8 ${
                  corner.includes('top') ? 'top-0' : 'bottom-0'
                } ${
                  corner.includes('left') ? 'left-0' : 'right-0'
                }`}
                style={{
                  borderTop: corner.includes('top') ? '3px solid #4ade80' : 'none',
                  borderBottom: corner.includes('bottom') ? '3px solid #4ade80' : 'none',
                  borderLeft: corner.includes('left') ? '3px solid #4ade80' : 'none',
                  borderRight: corner.includes('right') ? '3px solid #4ade80' : 'none',
                }}
              />
            ))}

            {/* Scanning line */}
            {status === 'scanning' && !scanned && (
              <div
                className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"
                style={{ animation: 'scanLine 2s ease-in-out infinite' }}
              />
            )}

            {/* Status indicator */}
            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-green-400 border-t-transparent" />
              </div>
            )}
            {scanned && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-green-400/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-400">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="relative z-10 bg-gradient-to-t from-black/80 to-transparent px-6 pb-safe pb-8 pt-6 text-center">
        {status === 'error' ? (
          <div className="space-y-3">
            <p className="text-red-400 text-sm">{errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm text-white backdrop-blur"
            >
              <RotateCcw className="h-4 w-4" />
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <QrCode className="h-4 w-4 text-green-400" />
              <p className="text-sm text-white/80">
                {scanned ? 'تم مسح الرمز بنجاح ✓' : 'جاهز للمسح'}
              </p>
            </div>
            <p className="text-xs text-white/40">
              ضع رمز QR داخل الإطار الأخضر
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 4px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: calc(100% - 4px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
