'use client';

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

export interface FirmaTouchCanvasRef {
  limpiar: () => void;
  obtenerFirmaBase64: () => string | null;
  tieneTrazo: boolean;
}

export interface FirmaTouchCanvasProps {
  onCambioTrazo?: (tieneTrazo: boolean) => void;
  grosorLinea?: number;
  colorTrazo?: string;
  altura?: number;
  className?: string;
}

export const FirmaTouchCanvas = forwardRef<FirmaTouchCanvasRef, FirmaTouchCanvasProps>(
  (
    {
      onCambioTrazo,
      grosorLinea = 2.5,
      colorTrazo = '#0f172a',
      altura = 180,
      className = '',
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    // Ajusta la resolución del canvas según devicePixelRatio para nitidez HD
    const setupCanvasResolution = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

      // Dimensiones visuales CSS vs buffer real del canvas
      canvas.width = rect.width * dpr;
      canvas.height = (altura || rect.height) * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = grosorLinea;
        ctx.strokeStyle = colorTrazo;
      }
    }, [altura, grosorLinea, colorTrazo]);

    useEffect(() => {
      setupCanvasResolution();

      const handleResize = () => {
        // Al redimensionar, configuramos de nuevo preservando las dimensiones CSS
        setupCanvasResolution();
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [setupCanvasResolution]);

    // Limpia todo el canvas
    const limpiar = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      setHasDrawn(false);
      lastPointRef.current = null;
      if (onCambioTrazo) {
        onCambioTrazo(false);
      }
    }, [onCambioTrazo]);

    // Exporta el Data URL de la firma
    const obtenerFirmaBase64 = useCallback((): string | null => {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return null;
      return canvas.toDataURL('image/png');
    }, [hasDrawn]);

    useImperativeHandle(
      ref,
      () => ({
        limpiar,
        obtenerFirmaBase64,
        tieneTrazo: hasDrawn,
      }),
      [limpiar, obtenerFirmaBase64, hasDrawn]
    );

    // Obtener coordenadas relativas al canvas
    const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const coords = getCoordinates(e);

      setIsDrawing(true);
      lastPointRef.current = coords;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, grosorLinea / 2, 0, Math.PI * 2);
        ctx.fillStyle = colorTrazo;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
      }

      if (!hasDrawn) {
        setHasDrawn(true);
        if (onCambioTrazo) {
          onCambioTrazo(true);
        }
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;

      const coords = getCoordinates(e);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (ctx && lastPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }

      lastPointRef.current = coords;
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignorado si el puntero ya se liberó
      }
      setIsDrawing(false);
      lastPointRef.current = null;
    };

    return (
      <div className={`relative w-full select-none ${className}`}>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            touchAction: 'none',
            height: `${altura}px`,
          }}
          className="w-full bg-slate-50 dark:bg-slate-900/60 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 cursor-crosshair transition-colors hover:border-brand-salmon/50"
          aria-label="Lienzo de firma digital para el cliente"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <span className="text-xs font-medium">Firme aquí con su dedo o stylus</span>
            <span className="text-[10px] mt-0.5 opacity-75">(Lienzo táctil de alta precisión)</span>
          </div>
        )}
      </div>
    );
  }
);

FirmaTouchCanvas.displayName = 'FirmaTouchCanvas';
