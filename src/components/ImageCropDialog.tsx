import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { X, Check, ZoomIn, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCroppedImg } from "@/lib/cropImage";

interface ImageCropDialogProps {
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropDialog({
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base">Crop Background Image</h3>
            <span className="text-xs text-muted-foreground">
              Adjust position and zoom for ideal app background
            </span>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Canvas Area */}
        <div className="relative w-full h-[360px] bg-black/90 select-none">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={16 / 9}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteInternal}
          />
        </div>

        {/* Controls Bar */}
        <div className="p-5 space-y-4 bg-card border-t">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium w-12 shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-xs font-mono text-muted-foreground w-10 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Rotation Slider */}
          <div className="flex items-center gap-3">
            <RotateCw className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium w-12 shrink-0">Rotate</span>
            <input
              type="range"
              min={0}
              max={360}
              step={90}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-xs font-mono text-muted-foreground w-10 text-right">
              {rotation}°
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={isProcessing}
              className="gap-1.5"
            >
              <Check className="w-4 h-4" /> Apply Cropped Image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
