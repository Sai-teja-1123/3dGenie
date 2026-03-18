import { useEffect, useRef, useState } from "react";

interface MagicCropModalProps {
  open: boolean;
  /** Source image URL to crop (object URL or remote) */
  imageUrl: string | null;
  /** Called when user closes the modal without applying a crop */
  onClose: () => void;
  /** Called with a new cropped preview image URL when user clicks Done */
  onCropped: (previewUrl: string) => void;
}

// Heavy crop UI + canvas logic, lazy-loaded from MagicMaker
const MagicCropModal = ({ open, imageUrl, onClose, onCropped }: MagicCropModalProps) => {
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);

  const [cropScale, setCropScale] = useState(1.0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropRect, setCropRect] = useState<{ x: number; y: number; size: number }>({
    x: 150,
    y: 150,
    size: 300,
  });
  const [minZoom, setMinZoom] = useState(0.1);
  const [cropDragMode, setCropDragMode] = useState<null | "move" | "nw" | "ne" | "sw" | "se">(null);
  const [dragStartPt, setDragStartPt] = useState<{ x: number; y: number } | null>(null);

  // Render the image onto the canvas with current crop state
  const renderCrop = () => {
    const canvas = cropCanvasRef.current;
    const img = cropImgRef.current;
    const container = cropContainerRef.current;
    if (!canvas || !img || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    if (containerWidth <= 0 || containerHeight <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, containerWidth, containerHeight);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, containerWidth, containerHeight);

    const iw = img.naturalWidth * cropScale;
    const ih = img.naturalHeight * cropScale;

    const cx = containerWidth / 2 + cropOffset.x;
    const cy = containerHeight / 2 + cropOffset.y;
    const dx = cx - iw / 2;
    const dy = cy - ih / 2;

    ctx.drawImage(img, dx, dy, iw, ih);
  };

  // Initialize image & crop state whenever modal opens with an image
  useEffect(() => {
    if (!open || !imageUrl) return;

    const img = new Image();
    img.onload = () => {
      cropImgRef.current = img;
      const container = cropContainerRef.current;
      if (!container) return;

      const initCrop = () => {
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        if (containerWidth <= 0 || containerHeight <= 0) {
          setTimeout(initCrop, 50);
          return;
        }

        const scaleToFitWidth = containerWidth / img.naturalWidth;
        const scaleToFitHeight = containerHeight / img.naturalHeight;
        const scaleToFit = Math.min(scaleToFitWidth, scaleToFitHeight);
        const calculatedMinZoom = scaleToFit * 0.3;
        const finalMinZoom = Math.max(0.05, calculatedMinZoom);
        setMinZoom(finalMinZoom);
        const initialScale = scaleToFit * 0.95;
        setCropScale(initialScale);
        setCropOffset({ x: 0, y: 0 });
        const containerSize = Math.min(containerWidth, containerHeight);
        const newCropSize = containerSize * 0.6;
        const cropX = (containerWidth - newCropSize) / 2;
        const cropY = (containerHeight - newCropSize) / 2;
        setCropRect({ x: cropX, y: cropY, size: newCropSize });
        renderCrop();
      };

      initCrop();
    };
    img.src = imageUrl;
  }, [open, imageUrl, cropOffset.x, cropOffset.y, cropScale]);

  // Resize observer to keep crop canvas in sync with container size
  useEffect(() => {
    if (!open) return;
    const container = cropContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      const img = cropImgRef.current;
      if (!img) return;
      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      if (containerWidth > 0 && containerHeight > 0) {
        const scaleToFitWidth = containerWidth / img.naturalWidth;
        const scaleToFitHeight = containerHeight / img.naturalHeight;
        const scaleToFit = Math.min(scaleToFitWidth, scaleToFitHeight);
        const calculatedMinZoom = scaleToFit * 0.5;
        const calculated = Math.max(0.05, calculatedMinZoom);
        setMinZoom(calculated);
      }
      renderCrop();
    });

    resizeObserver.observe(container);
    renderCrop();
    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cropScale, cropOffset.x, cropOffset.y]);

  if (!open || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h[90vh] glass text-white rounded-3xl border border-white/10 p-6 sm:p-8 select-none flex flex-col shadow-[0_0_40px_rgba(0,242,255,0.15)] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 font-bold mb-1">Image Tool</p>
            <h3 className="text-xl font-extrabold">Crop to Select Face</h3>
            <p className="text-sm text-white/60 mt-1">Adjust the crop area to focus on the face</p>
          </div>
          <button
            className="text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10 p-2"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div
          ref={cropContainerRef}
          className="relative w-full flex-1 min-h-0 rounded-2xl overflow-hidden bg-black/70 border border-white/10 select-none shadow-2xl ring-1 ring-[#00f2ff]/20"
          style={{ minHeight: "400px", maxHeight: "calc(90vh - 200px)", aspectRatio: "4 / 3" }}
          onMouseDown={(e) => {
            const rect = cropContainerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const h = 14;
            const within = (rx: number, ry: number) => x >= rx && x <= rx + h && y >= ry && y <= ry + h;
            if (within(cropRect.x - h / 2, cropRect.y - h / 2)) {
              setCropDragMode("nw");
            } else if (within(cropRect.x + cropRect.size - h / 2, cropRect.y - h / 2)) {
              setCropDragMode("ne");
            } else if (within(cropRect.x - h / 2, cropRect.y + cropRect.size - h / 2)) {
              setCropDragMode("sw");
            } else if (within(cropRect.x + cropRect.size - h / 2, cropRect.y + cropRect.size - h / 2)) {
              setCropDragMode("se");
            } else if (
              x >= cropRect.x &&
              x <= cropRect.x + cropRect.size &&
              y >= cropRect.y &&
              y <= cropRect.y + cropRect.size
            ) {
              setCropDragMode("move");
            } else {
              setCropDragMode(null);
            }
            setDragStartPt({ x, y });
          }}
          onMouseMove={(e) => {
            if (!cropDragMode || !dragStartPt) return;
            const rect = cropContainerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const dx = x - dragStartPt.x;
            const dy = y - dragStartPt.y;
            setDragStartPt({ x, y });
            setCropRect((prev) => {
              let { x: px, y: py, size } = prev;
              const maxWidth = rect.width;
              const maxHeight = rect.height;
              const maxSize = Math.min(maxWidth, maxHeight);

              if (cropDragMode === "move") {
                px = Math.max(0, Math.min(maxWidth - size, px + dx));
                py = Math.max(0, Math.min(maxHeight - size, py + dy));
                return { x: px, y: py, size };
              }

              if (cropDragMode === "nw") {
                px += dx;
                py += dy;
                size -= Math.max(dx, dy);
              } else if (cropDragMode === "ne") {
                py += dy;
                size -= Math.max(-dx, dy);
              } else if (cropDragMode === "sw") {
                px += dx;
                size -= Math.max(dx, -dy);
              } else if (cropDragMode === "se") {
                size += Math.max(dx, dy);
              }

              size = Math.max(50, Math.min(maxSize, size));
              px = Math.max(0, Math.min(maxWidth - size, px));
              py = Math.max(0, Math.min(maxHeight - size, py));
              return { x: px, y: py, size };
            });
          }}
          onMouseUp={() => {
            setCropDragMode(null);
            setDragStartPt(null);
          }}
          onMouseLeave={() => {
            setCropDragMode(null);
            setDragStartPt(null);
          }}
        >
          <canvas ref={cropCanvasRef} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute border-2 border-[#00f2ff] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
            style={{ left: cropRect.x, top: cropRect.y, width: cropRect.size, height: cropRect.size }}
          >
            {(["nw", "ne", "sw", "se"] as const).map((pos) => {
              const half = 7;
              const style = {
                width: 14,
                height: 14,
                background: "#00f2ff",
                borderRadius: 3,
                position: "absolute" as const,
                left: pos.includes("e") ? cropRect.size - half : -half,
                top: pos.includes("s") ? cropRect.size - half : -half,
                cursor: `${pos}-resize`,
              };
              return <div key={pos} style={style} />;
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-white/60">Zoom</span>
          <input
            type="range"
            min={minZoom}
            max={3}
            step={0.02}
            value={cropScale}
            onChange={(e) => setCropScale(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3 flex-shrink-0">
          <button
            className="glass hover:bg-white/10 text-white border border-white/10 rounded-xl px-6 py-3 text-[11px] uppercase tracking-widest font-bold transition-all hover:scale-105 backdrop-blur-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="relative group bg-gradient-action text-white font-bold rounded-xl px-8 py-3 text-[11px] uppercase tracking-widest transition-all hover:opacity-95 hover:scale-105 shadow-[0_0_20px_rgba(112,0,255,0.3)] overflow-hidden"
            onClick={() => {
              const viewCanvas = cropCanvasRef.current;
              const img = cropImgRef.current;
              const container = cropContainerRef.current;
              if (!viewCanvas || !img || !container) return;

              const rect = container.getBoundingClientRect();
              const containerWidth = rect.width;
              const containerHeight = rect.height;

              const exportCanvas = document.createElement("canvas");
              exportCanvas.width = 600;
              exportCanvas.height = 600;
              const ctx = exportCanvas.getContext("2d");
              if (!ctx) return;

              const iw = img.naturalWidth * cropScale;
              const ih = img.naturalHeight * cropScale;
              const cx = containerWidth / 2 + cropOffset.x;
              const cy = containerHeight / 2 + cropOffset.y;
              const dx = cx - iw / 2;
              const dy = cy - ih / 2;
              const scaleExport = 600 / cropRect.size;
              ctx.setTransform(scaleExport, 0, 0, scaleExport, -cropRect.x * scaleExport, -cropRect.y * scaleExport);
              ctx.drawImage(img, dx, dy, iw, ih);
              exportCanvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                onCropped(url);
              }, "image/jpeg", 0.92);
            }}
          >
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative">Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MagicCropModal;

