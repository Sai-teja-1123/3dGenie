import { useCallback, useEffect, useRef, useState } from "react";

interface MagicCropModalProps {
  open: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onCropped: (previewUrl: string) => void;
}

const MagicCropModal = ({ open, imageUrl, onClose, onCropped }: MagicCropModalProps) => {
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);

  const [cropScale, setCropScale] = useState(1.0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropRect, setCropRect] = useState<{ x: number; y: number; size: number }>({
    x: 150, y: 150, size: 300,
  });
  const [minZoom, setMinZoom] = useState(0.1);
  const [cropDragMode, setCropDragMode] = useState<
    null | "move" | "nw" | "ne" | "sw" | "se" | "pan"
  >(null);
  const [dragStartPt, setDragStartPt] = useState<{ x: number; y: number } | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectingFace, setDetectingFace] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);

  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef<number>(1);
  const initializedForUrl = useRef<string | null>(null);

  const cropScaleRef = useRef(cropScale);
  cropScaleRef.current = cropScale;
  const cropOffsetRef = useRef(cropOffset);
  cropOffsetRef.current = cropOffset;
  const cropRectRef = useRef(cropRect);
  cropRectRef.current = cropRect;

  // Fade out the hint tooltip after 4 seconds
  useEffect(() => {
    if (!open) return;
    setShowHint(true);
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, [open]);

  // Animate in
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [open]);

  const renderCrop = useCallback(() => {
    const canvas = cropCanvasRef.current;
    const img = cropImgRef.current;
    const container = cropContainerRef.current;
    if (!canvas || !img || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    if (cw <= 0 || ch <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, cw, ch);

    const iw = img.naturalWidth * cropScaleRef.current;
    const ih = img.naturalHeight * cropScaleRef.current;
    const dx = cw / 2 + cropOffsetRef.current.x - iw / 2;
    const dy = ch / 2 + cropOffsetRef.current.y - ih / 2;

    ctx.drawImage(img, dx, dy, iw, ih);
  }, []);

  const attemptFaceDetection = useCallback(
    async (img: HTMLImageElement, containerWidth: number, containerHeight: number, scale: number) => {
      if (!("FaceDetector" in window)) return false;
      setDetectingFace(true);
      try {
        // @ts-expect-error FaceDetector is not in TS lib yet
        const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        const faces = await detector.detect(img);
        if (faces.length > 0) {
          const face = faces[0].boundingBox;
          const fcxN = (face.x + face.width / 2) / img.naturalWidth;
          const fcyN = (face.y + face.height / 2) / img.naturalHeight;

          const iw = img.naturalWidth * scale;
          const ih = img.naturalHeight * scale;
          const fsx = containerWidth / 2 - iw / 2 + fcxN * iw;
          const fsy = containerHeight / 2 - ih / 2 + fcyN * ih;

          const faceW = (face.width / img.naturalWidth) * iw;
          const faceH = (face.height / img.naturalHeight) * ih;
          const faceSz = Math.max(faceW, faceH);

          const maxSz = Math.min(containerWidth, containerHeight);
          const cropSize = Math.min(maxSz * 0.7, Math.max(faceSz * 1.8, 150));
          const cropX = Math.max(0, Math.min(containerWidth - cropSize, fsx - cropSize / 2));
          const cropY = Math.max(0, Math.min(containerHeight - cropSize, fsy - cropSize / 2));

          setCropRect({ x: cropX, y: cropY, size: cropSize });
          setFaceDetected(true);
          setDetectingFace(false);
          return true;
        }
      } catch { /* not supported */ }
      setDetectingFace(false);
      return false;
    },
    []
  );

  useEffect(() => {
    if (!open || !imageUrl) return;
    if (initializedForUrl.current === imageUrl) return;
    initializedForUrl.current = imageUrl;
    setFaceDetected(false);

    const img = new Image();
    img.onload = () => {
      cropImgRef.current = img;
      const container = cropContainerRef.current;
      if (!container) return;

      const initCrop = async () => {
        const rect = container.getBoundingClientRect();
        const cw = rect.width;
        const ch = rect.height;
        if (cw <= 0 || ch <= 0) { setTimeout(initCrop, 50); return; }

        const fit = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
        const finalMinZoom = Math.max(0.05, fit * 0.3);
        setMinZoom(finalMinZoom);
        const initialScale = fit * 0.95;
        setCropScale(initialScale);
        setCropOffset({ x: 0, y: 0 });
        cropScaleRef.current = initialScale;
        cropOffsetRef.current = { x: 0, y: 0 };

        const sz = Math.min(cw, ch) * 0.6;
        setCropRect({ x: (cw - sz) / 2, y: (ch - sz) / 2, size: sz });
        cropRectRef.current = { x: (cw - sz) / 2, y: (ch - sz) / 2, size: sz };
        renderCrop();
        await attemptFaceDetection(img, cw, ch, initialScale);
      };
      initCrop();
    };
    img.src = imageUrl;
  }, [open, imageUrl, renderCrop, attemptFaceDetection]);

  useEffect(() => {
    if (!open) return;
    renderCrop();
  }, [open, cropScale, cropOffset.x, cropOffset.y, renderCrop]);

  useEffect(() => {
    if (!open) return;
    const container = cropContainerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const img = cropImgRef.current;
      if (!img) return;
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const fit = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
        setMinZoom(Math.max(0.05, fit * 0.5));
      }
      renderCrop();
    });
    ro.observe(container);
    renderCrop();
    return () => ro.disconnect();
  }, [open, renderCrop]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 10 : 2;
      switch (e.key) {
        case "ArrowLeft":  e.preventDefault(); setCropRect(p => ({ ...p, x: Math.max(0, p.x - step) })); break;
        case "ArrowRight": e.preventDefault(); setCropRect(p => { const mx = (cropContainerRef.current?.getBoundingClientRect().width ?? 9999) - p.size; return { ...p, x: Math.min(mx, p.x + step) }; }); break;
        case "ArrowUp":    e.preventDefault(); setCropRect(p => ({ ...p, y: Math.max(0, p.y - step) })); break;
        case "ArrowDown":  e.preventDefault(); setCropRect(p => { const my = (cropContainerRef.current?.getBoundingClientRect().height ?? 9999) - p.size; return { ...p, y: Math.min(my, p.y + step) }; }); break;
        case "+": case "=": e.preventDefault(); setCropScale(p => Math.min(3, p + 0.05)); break;
        case "-": case "_": e.preventDefault(); setCropScale(p => Math.max(minZoom, p - 0.05)); break;
        case "Escape": e.preventDefault(); onClose(); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, minZoom, onClose]);

  const handleResetCrop = useCallback(() => {
    const container = cropContainerRef.current;
    const img = cropImgRef.current;
    if (!container || !img) return;
    const rect = container.getBoundingClientRect();
    const fit = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    setCropScale(fit * 0.95);
    setCropOffset({ x: 0, y: 0 });
    const sz = Math.min(rect.width, rect.height) * 0.6;
    setCropRect({ x: (rect.width - sz) / 2, y: (rect.height - sz) / 2, size: sz });
    setFaceDetected(false);
  }, []);

  const handleAutoDetect = useCallback(async () => {
    const img = cropImgRef.current;
    const container = cropContainerRef.current;
    if (!img || !container) return;
    const rect = container.getBoundingClientRect();
    const detected = await attemptFaceDetection(img, rect.width, rect.height, cropScaleRef.current);
    if (!detected) {
      const sz = Math.min(rect.width, rect.height) * 0.55;
      setCropRect({
        x: Math.max(0, (rect.width - sz) / 2),
        y: Math.max(0, (rect.height - sz) / 2 - rect.height * 0.05),
        size: sz,
      });
    }
  }, [attemptFaceDetection]);

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent, rect: DOMRect) => {
    if ("touches" in e) { const t = e.touches[0]; return { x: t.clientX - rect.left, y: t.clientY - rect.top }; }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getTouchDist = (e: React.TouchEvent) => {
    if (e.touches.length < 2) return 0;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = cropContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if ("touches" in e && e.touches.length === 2) {
      pinchStartDist.current = getTouchDist(e);
      pinchStartScale.current = cropScaleRef.current;
      return;
    }
    const { x, y } = getPointerPos(e, rect);
    const h = 24;
    const cr = cropRectRef.current;
    const within = (rx: number, ry: number) => x >= rx - h / 2 && x <= rx + h / 2 && y >= ry - h / 2 && y <= ry + h / 2;

    if (within(cr.x, cr.y)) setCropDragMode("nw");
    else if (within(cr.x + cr.size, cr.y)) setCropDragMode("ne");
    else if (within(cr.x, cr.y + cr.size)) setCropDragMode("sw");
    else if (within(cr.x + cr.size, cr.y + cr.size)) setCropDragMode("se");
    else if (x >= cr.x && x <= cr.x + cr.size && y >= cr.y && y <= cr.y + cr.size) setCropDragMode("move");
    else setCropDragMode("pan");
    setDragStartPt({ x, y });
    setShowHint(false);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = cropContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if ("touches" in e && e.touches.length === 2 && pinchStartDist.current !== null) {
      const ratio = getTouchDist(e) / pinchStartDist.current;
      setCropScale(Math.max(minZoom, Math.min(3, pinchStartScale.current * ratio)));
      return;
    }
    if (!cropDragMode || !dragStartPt) return;
    const { x, y } = getPointerPos(e, rect);
    const dx = x - dragStartPt.x;
    const dy = y - dragStartPt.y;
    setDragStartPt({ x, y });

    if (cropDragMode === "pan") { setCropOffset(p => ({ x: p.x + dx, y: p.y + dy })); return; }
    setCropRect(prev => {
      let { x: px, y: py, size } = prev;
      const mw = rect.width, mh = rect.height, ms = Math.min(mw, mh);
      if (cropDragMode === "move") { return { x: Math.max(0, Math.min(mw - size, px + dx)), y: Math.max(0, Math.min(mh - size, py + dy)), size }; }
      if (cropDragMode === "nw") { const d = Math.max(dx, dy); px += d; py += d; size -= d; }
      else if (cropDragMode === "ne") { const d = Math.max(-dx, dy); py += d; size -= d; }
      else if (cropDragMode === "sw") { const d = Math.max(dx, -dy); px += d; size -= d; }
      else if (cropDragMode === "se") { size += Math.max(dx, dy); }
      size = Math.max(60, Math.min(ms, size));
      px = Math.max(0, Math.min(mw - size, px));
      py = Math.max(0, Math.min(mh - size, py));
      return { x: px, y: py, size };
    });
  };

  const handlePointerUp = () => { setCropDragMode(null); setDragStartPt(null); pinchStartDist.current = null; };

  const handleExport = () => {
    const img = cropImgRef.current;
    const container = cropContainerRef.current;
    if (!img || !container) return;
    const rect = container.getBoundingClientRect();
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 600;
    exportCanvas.height = 600;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;
    const iw = img.naturalWidth * cropScale;
    const ih = img.naturalHeight * cropScale;
    const dx = rect.width / 2 + cropOffset.x - iw / 2;
    const dy = rect.height / 2 + cropOffset.y - ih / 2;
    const s = 600 / cropRect.size;
    ctx.setTransform(s, 0, 0, s, -cropRect.x * s, -cropRect.y * s);
    ctx.drawImage(img, dx, dy, iw, ih);
    exportCanvas.toBlob(blob => { if (blob) onCropped(URL.createObjectURL(blob)); }, "image/jpeg", 0.92);
  };

  useEffect(() => { if (!open) initializedForUrl.current = null; }, [open]);

  if (!open || !imageUrl) return null;

  const statusText = detectingFace
    ? "Scanning for face..."
    : faceDetected
      ? "Face found — adjust if needed"
      : "Position the face inside the frame";

  const bracketLen = Math.min(20, cropRect.size * 0.1);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-3 sm:p-5">
      <div
        className={`w-full max-w-[900px] h-[calc(100vh-24px)] sm:h-[calc(100vh-40px)] max-h-[700px] text-white rounded-2xl border border-white/[0.08] select-none flex flex-col overflow-hidden transition-all duration-300 ease-out ${
          animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{ background: "linear-gradient(145deg, rgba(15,15,25,0.97), rgba(8,8,18,0.98))" }}
      >
        {/* Header — compact single row */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Crop icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00f2ff]/10 border border-[#00f2ff]/20 flex-shrink-0">
              <svg className="w-4 h-4 text-[#00f2ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 2v4M3 7h4m0 0v10a1 1 0 001 1h10m4 0v4m0-4h-4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold tracking-tight truncate">Crop Face</h3>
              <p className="text-[11px] text-white/50 truncate">{statusText}</p>
            </div>
          </div>

          {/* Status badge */}
          {faceDetected && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 px-2.5 py-0.5 text-[10px] text-emerald-300 font-semibold flex-shrink-0">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Detected
            </span>
          )}
          {detectingFace && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff]/20 px-2.5 py-0.5 text-[10px] text-[#00f2ff] font-semibold flex-shrink-0">
              <div className="w-2.5 h-2.5 border-[1.5px] border-[#00f2ff] border-t-transparent rounded-full animate-spin" />
              Scanning
            </span>
          )}

          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Canvas — takes all available space */}
        <div className="flex-1 min-h-0 relative">
          <div
            ref={cropContainerRef}
            className="absolute inset-0 select-none"
            style={{ touchAction: "none", cursor: cropDragMode === "pan" ? "grabbing" : cropDragMode ? "default" : "crosshair" }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onTouchCancel={handlePointerUp}
          >
            <canvas ref={cropCanvasRef} className="absolute inset-0 w-full h-full" />

            {/* Dim overlay with cutout */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <mask id="cropMask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect x={cropRect.x} y={cropRect.y} width={cropRect.size} height={cropRect.size} rx="2" fill="black" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#cropMask)" />
            </svg>

            {/* Crop frame */}
            <div
              className="absolute pointer-events-none"
              style={{ left: cropRect.x, top: cropRect.y, width: cropRect.size, height: cropRect.size }}
            >
              <div className="absolute inset-0 border border-white/30 rounded-sm" />

              {/* Circular face guide */}
              <div
                className="absolute rounded-full border border-dashed border-white/15"
                style={{ left: "10%", top: "10%", width: "80%", height: "80%" }}
              />

              {/* Crosshair center dot */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30" />

              {/* L-bracket corners */}
              {(["nw", "ne", "sw", "se"] as const).map(pos => {
                const isL = pos.includes("w"), isT = pos.includes("n");
                return (
                  <div key={pos} className="absolute" style={{
                    left: isL ? -1 : undefined, right: isL ? undefined : -1,
                    top: isT ? -1 : undefined, bottom: isT ? undefined : -1,
                    width: bracketLen, height: bracketLen, cursor: `${pos}-resize`,
                  }}>
                    <div className="absolute bg-[#00f2ff]" style={{
                      [isT ? "top" : "bottom"]: 0, [isL ? "left" : "right"]: 0,
                      width: bracketLen, height: 2.5, borderRadius: 1,
                      boxShadow: "0 0 8px rgba(0,242,255,0.6)",
                    }} />
                    <div className="absolute bg-[#00f2ff]" style={{
                      [isT ? "top" : "bottom"]: 0, [isL ? "left" : "right"]: 0,
                      width: 2.5, height: bracketLen, borderRadius: 1,
                      boxShadow: "0 0 8px rgba(0,242,255,0.6)",
                    }} />
                  </div>
                );
              })}
            </div>

            {/* Floating hint — auto-fades */}
            <div
              className={`absolute bottom-14 left-1/2 -translate-x-1/2 rounded-full bg-black/70 border border-white/10 backdrop-blur-md px-4 py-1.5 text-[11px] text-white/60 whitespace-nowrap pointer-events-none transition-opacity duration-700 ${
                showHint ? "opacity-100" : "opacity-0"
              }`}
            >
              Drag inside to move  ·  Drag outside to pan  ·  Corners to resize
            </div>

            {/* Floating zoom bar — overlay at bottom of canvas */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-black/60 border border-white/[0.08] backdrop-blur-md px-3 py-1.5">
              <button
                type="button"
                onClick={() => setCropScale(p => Math.max(minZoom, p - 0.1))}
                className="flex items-center justify-center w-6 h-6 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm font-bold"
                aria-label="Zoom out"
              >
                −
              </button>
              <input
                type="range"
                min={minZoom}
                max={3}
                step={0.02}
                value={cropScale}
                onChange={e => setCropScale(parseFloat(e.target.value))}
                className="w-28 sm:w-40 accent-[#00f2ff] h-1"
              />
              <button
                type="button"
                onClick={() => setCropScale(p => Math.min(3, p + 0.1))}
                className="flex items-center justify-center w-6 h-6 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm font-bold"
                aria-label="Zoom in"
              >
                +
              </button>
              <span className="text-[10px] text-white/35 tabular-nums w-[34px] text-right">
                {Math.round(cropScale * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar — single compact row */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] flex-shrink-0 bg-black/20">
          {/* Left: utility */}
          <button
            className="text-white/50 hover:text-white hover:bg-white/10 rounded-lg px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all"
            onClick={handleResetCrop}
          >
            Reset
          </button>
          {"FaceDetector" in window && (
            <button
              className="text-[#00f2ff]/70 hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 rounded-lg px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all disabled:opacity-40"
              onClick={handleAutoDetect}
              disabled={detectingFace}
            >
              {detectingFace ? "Scanning..." : "Auto-detect"}
            </button>
          )}

          <div className="flex-1" />

          {/* Right: primary actions */}
          <button
            className="text-white/50 hover:text-white hover:bg-white/10 rounded-lg px-4 py-1.5 text-[11px] font-semibold tracking-wide transition-all"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="relative group bg-gradient-to-r from-[#7000ff] to-[#00f2ff] text-white font-bold rounded-lg px-6 py-1.5 text-[11px] tracking-wide transition-all hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleExport}
          >
            <span className="relative">Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MagicCropModal;
