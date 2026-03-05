"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrScanner = QrScanner;
var react_1 = require("react");
var html5_qrcode_1 = require("html5-qrcode");
var lucide_react_1 = require("lucide-react");
function QrScanner(_a) {
    var _this = this;
    var onScan = _a.onScan, onClose = _a.onClose;
    var scannerRef = (0, react_1.useRef)(null);
    var _b = (0, react_1.useState)('loading'), status = _b[0], setStatus = _b[1];
    var _c = (0, react_1.useState)(''), errorMsg = _c[0], setErrorMsg = _c[1];
    var _d = (0, react_1.useState)(false), torchOn = _d[0], setTorchOn = _d[1];
    var _e = (0, react_1.useState)(false), scanned = _e[0], setScanned = _e[1];
    (0, react_1.useEffect)(function () {
        var id = 'qr-reader-container';
        var scanner = new html5_qrcode_1.Html5Qrcode(id);
        scannerRef.current = scanner;
        html5_qrcode_1.Html5Qrcode.getCameras()
            .then(function (cameras) {
            var _a;
            if (!cameras.length) {
                setStatus('error');
                setErrorMsg('لا توجد كاميرا متاحة');
                return;
            }
            // Prefer back camera
            var cam = (_a = cameras.find(function (c) {
                return c.label.toLowerCase().includes('back') ||
                    c.label.toLowerCase().includes('rear') ||
                    c.label.toLowerCase().includes('environment');
            })) !== null && _a !== void 0 ? _a : cameras[cameras.length - 1];
            return scanner.start(cam.id, {
                fps: 15,
                qrbox: { width: 260, height: 260 },
                aspectRatio: 1.0,
            }, function (decodedText) {
                if (scanned)
                    return;
                setScanned(true);
                // Extract label code from URL if it's a verify URL
                var match = decodedText.match(/\/verify\/([^/?#]+)/);
                var code = match ? match[1] : decodedText;
                scanner.stop().catch(function () { });
                onScan(code);
            }, function () { });
        })
            .then(function () { return setStatus('scanning'); })
            .catch(function (err) {
            var _a;
            setStatus('error');
            setErrorMsg(((_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.includes('Permission'))
                ? 'لم يتم منح إذن الكاميرا'
                : 'تعذّر تشغيل الكاميرا');
        });
        return function () {
            var _a;
            (_a = scannerRef.current) === null || _a === void 0 ? void 0 : _a.stop().catch(function () { });
        };
    }, []);
    var toggleTorch = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    if (!scannerRef.current) return [3 /*break*/, 5];
                    if (!torchOn) return [3 /*break*/, 2];
                    return [4 /*yield*/, scannerRef.current.applyVideoConstraints({ advanced: [{ torch: false }] })];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, scannerRef.current.applyVideoConstraints({ advanced: [{ torch: true }] })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    setTorchOn(!torchOn);
                    _b.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    _a = _b.sent();
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-safe pt-6 pb-4 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
          <lucide_react_1.X className="h-5 w-5"/>
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-white">مسح رمز QR</p>
          <p className="text-xs text-white/60">وجّه الكاميرا نحو الرمز</p>
        </div>
        <button onClick={toggleTorch} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
          {torchOn ? <lucide_react_1.FlashlightOff className="h-5 w-5"/> : <lucide_react_1.Flashlight className="h-5 w-5"/>}
        </button>
      </div>

      {/* Camera feed */}
      <div className="relative flex-1 overflow-hidden">
        {/* Hidden qr reader div — html5-qrcode renders video here */}
        <div id="qr-reader-container" className="absolute inset-0 [&>video]:h-full [&>video]:w-full [&>video]:object-cover [&_canvas]:hidden [&_img]:hidden" style={{ width: '100%', height: '100%' }}/>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Dark corners */}
          <div className="absolute inset-0 bg-black/50" style={{
            maskImage: 'radial-gradient(ellipse 280px 280px at center, transparent 50%, black 51%)',
            WebkitMaskImage: 'radial-gradient(ellipse 280px 280px at center, transparent 50%, black 51%)',
        }}/>

          {/* Scan frame */}
          <div className="relative h-64 w-64">
            {/* Corner brackets */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(function (corner) { return (<div key={corner} className={"absolute h-8 w-8 ".concat(corner.includes('top') ? 'top-0' : 'bottom-0', " ").concat(corner.includes('left') ? 'left-0' : 'right-0')} style={{
                borderTop: corner.includes('top') ? '3px solid #4ade80' : 'none',
                borderBottom: corner.includes('bottom') ? '3px solid #4ade80' : 'none',
                borderLeft: corner.includes('left') ? '3px solid #4ade80' : 'none',
                borderRight: corner.includes('right') ? '3px solid #4ade80' : 'none',
            }}/>); })}

            {/* Scanning line */}
            {status === 'scanning' && !scanned && (<div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent" style={{ animation: 'scanLine 2s ease-in-out infinite' }}/>)}

            {/* Status indicator */}
            {status === 'loading' && (<div className="absolute inset-0 flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-green-400 border-t-transparent"/>
              </div>)}
            {scanned && (<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-green-400/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-400">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
              </div>)}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="relative z-10 bg-gradient-to-t from-black/80 to-transparent px-6 pb-safe pb-8 pt-6 text-center">
        {status === 'error' ? (<div className="space-y-3">
            <p className="text-red-400 text-sm">{errorMsg}</p>
            <button onClick={function () { return window.location.reload(); }} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm text-white backdrop-blur">
              <lucide_react_1.RotateCcw className="h-4 w-4"/>
              إعادة المحاولة
            </button>
          </div>) : (<div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <lucide_react_1.QrCode className="h-4 w-4 text-green-400"/>
              <p className="text-sm text-white/80">
                {scanned ? 'تم مسح الرمز بنجاح ✓' : 'جاهز للمسح'}
              </p>
            </div>
            <p className="text-xs text-white/40">
              ضع رمز QR داخل الإطار الأخضر
            </p>
          </div>)}
      </div>

      <style>{"\n        @keyframes scanLine {\n          0% { top: 4px; opacity: 0; }\n          10% { opacity: 1; }\n          90% { opacity: 1; }\n          100% { top: calc(100% - 4px); opacity: 0; }\n        }\n      "}</style>
    </div>);
}
