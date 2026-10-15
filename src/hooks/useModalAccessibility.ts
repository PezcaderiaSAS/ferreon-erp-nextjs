"use client";

import { useEffect, useRef } from "react";

export interface UseModalAccessibilityOptions<T extends HTMLElement = HTMLDivElement> {
  /**
   * Si el modal se encuentra abierto actualmente.
   */
  isOpen: boolean;
  /**
   * Callback invocado al presionar la tecla Escape.
   */
  onClose: () => void;
  /**
   * Bloquea el cierre si hay una operación en curso (ej. Server Action pendiente).
   */
  isBlocked?: boolean;
  /**
   * Si hay un modal anidado activo en la capa superior, delega Escape al hijo (comportamiento LIFO).
   */
  isNestedOpen?: boolean;
  /**
   * Referencia opcional al elemento con foco inicial.
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
 * Hook de accesibilidad para modales y diálogos flotantes en Alquileres System.
 * Cumple con WCAG 2.1 AA (2.1.1 Teclado, 2.1.2 Sin trampa inadvertida) y arquitectura LIFO para modales anidados.
 */
export function useModalAccessibility<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  isBlocked = false,
  isNestedOpen = false,
  initialFocusRef,
  returnFocusOnDeactivate = true,
}: UseModalAccessibilityOptions<T>) {
  const containerRef = useRef<T | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Guardar el elemento previamente enfocado para restaurarlo al cerrar
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement;
    }

    const container = containerRef.current;

    // Obtener elementos interactivos visibles si existe contenedor
    const getFocusableElements = (): HTMLElement[] => {
      if (!container) return [];
      const candidates = Array.from(
        container.querySelectorAll<HTMLElement>(SELECTOR_FOCUSABLE)
      );
      return candidates.filter((el) => {
        return (
          el.offsetParent !== null &&
          window.getComputedStyle(el).visibility !== 'hidden' &&
          el.getAttribute('aria-hidden') !== 'true'
        );
      });
    };

    // 2. Colocar el foco inicial en el contenedor o elemento interactivo
    const focusTimer = setTimeout(() => {
      // Si no hay contenedor o hay un modal anidado activo en la capa superior, no forzar foco
      if (!container || isNestedOpen) return;

      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusables = getFocusableElements();
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          if (!container.hasAttribute('tabindex')) {
            container.setAttribute('tabindex', '-1');
          }
          container.focus();
        }
      }
    }, 20);

    // 3. Manejador de teclado para Tab circular y Escape LIFO
    const handleKeyDown = (event: KeyboardEvent) => {
      // Manejo de Escape
      if (event.key === 'Escape') {
        // Si está bloqueado (operación asíncrona) o hay un modal anidado hijo, se ignora
        if (isBlocked || isNestedOpen) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      // Trampa de foco (Tab circular) si no hay modal anidado activo y existe contenedor
      if (event.key === 'Tab' && !isNestedOpen && container) {
        const focusables = getFocusableElements();
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: navegación hacia atrás
          if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: navegación hacia adelante
          if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    // 4. Limpieza al desmontar o desactivar
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, true);

      if (returnFocusOnDeactivate && previousActiveElementRef.current) {
        const previousEl = previousActiveElementRef.current;
        setTimeout(() => {
          if (document.body.contains(previousEl)) {
            previousEl.focus();
          }
        }, 10);
      }
    };
  }, [isOpen, onClose, isBlocked, isNestedOpen, initialFocusRef, returnFocusOnDeactivate]);

  return containerRef;
}
