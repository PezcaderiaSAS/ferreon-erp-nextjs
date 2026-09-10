"use client";

import { useEffect, useRef } from "react";

export interface UseFocusTrapOptions {
  /**
   * Si el focus trap se encuentra activo actualmente (ej. modal abierto).
   */
  isActive: boolean;
  /**
   * Callback invocado al presionar la tecla Escape.
   */
  onEscape?: () => void;
  /**
   * Referencia opcional al elemento que debe recibir el foco inicial al abrirse.
   */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /**
   * Determina si se restaura el foco al elemento previo al cerrarse (por defecto true).
   */
  returnFocusOnDeactivate?: boolean;
}

const SELECTOR_FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Hook para atrapar el foco dentro de un contenedor (diálogos, modales)
 * cumpliendo con los estándares de accesibilidad WCAG 2.1 AA.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isActive,
  onEscape,
  initialFocusRef,
  returnFocusOnDeactivate = true,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // 1. Guardar el elemento previamente enfocado para restaurarlo al cerrar
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // Función auxiliar para obtener todos los elementos interactivos visibles
    const getFocusableElements = (): HTMLElement[] => {
      const candidates = Array.from(
        container.querySelectorAll<HTMLElement>(SELECTOR_FOCUSABLE)
      );
      return candidates.filter((el) => {
        // Filtrar elementos invisibles o con aria-hidden
        return (
          el.offsetParent !== null &&
          window.getComputedStyle(el).visibility !== "hidden" &&
          el.getAttribute("aria-hidden") !== "true"
        );
      });
    };

    // 2. Colocar el foco inicial en el contenedor o elemento interactivo
    const focusTimer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusables = getFocusableElements();
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          // Si no hay hijos enfocables, permitir enfocar el contenedor
          if (!container.hasAttribute("tabindex")) {
            container.setAttribute("tabindex", "-1");
          }
          container.focus();
        }
      }
    }, 20);

    // 3. Manejador de teclado para Tab circular y Escape
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
        return;
      }

      if (event.key === "Tab") {
        const focusables = getFocusableElements();
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (event.shiftKey) {
          // Navegación hacia atrás (Shift + Tab)
          if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Navegación hacia adelante (Tab)
          if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    // 4. Limpieza al desmontar o desactivar
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown, true);

      if (returnFocusOnDeactivate && previousActiveElementRef.current) {
        // Restaurar foco de forma segura
        const previousEl = previousActiveElementRef.current;
        setTimeout(() => {
          if (document.body.contains(previousEl)) {
            previousEl.focus();
          }
        }, 10);
      }
    };
  }, [isActive, onEscape, initialFocusRef, returnFocusOnDeactivate]);

  return containerRef;
}
