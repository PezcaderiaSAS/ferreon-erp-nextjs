// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';

describe('Hook: useModalAccessibility (WCAG 2.1 AA & LIFO Escape)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Debe invocar onClose cuando el modal está abierto y se presiona la tecla Escape', () => {
    const onClose = vi.fn();

    renderHook(() =>
      useModalAccessibility({
        isOpen: true,
        onClose,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('2. NO debe invocar onClose al presionar Escape si isOpen es false', () => {
    const onClose = vi.fn();

    renderHook(() =>
      useModalAccessibility({
        isOpen: false,
        onClose,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('3. NO debe invocar onClose al presionar Escape si isBlocked es true (operación en curso)', () => {
    const onClose = vi.fn();

    renderHook(() =>
      useModalAccessibility({
        isOpen: true,
        onClose,
        isBlocked: true,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('4. Comportamiento LIFO: NO debe invocar onClose en el modal padre si isNestedOpen es true', () => {
    const onModalPadreClose = vi.fn();

    // Modal padre con un modal hijo abierto en la capa superior
    renderHook(() =>
      useModalAccessibility({
        isOpen: true,
        onClose: onModalPadreClose,
        isNestedOpen: true, // Modal hijo activo
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    // El modal padre no debe cerrarse, delegando el escape al hijo
    expect(onModalPadreClose).not.toHaveBeenCalled();
  });

  it('5. Debe limpiar los event listeners de teclado al desmontarse', () => {
    const onClose = vi.fn();

    const { unmount } = renderHook(() =>
      useModalAccessibility({
        isOpen: true,
        onClose,
      })
    );

    unmount();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('6. Debe ignorar otras teclas que no sean Escape para el cierre del diálogo', () => {
    const onClose = vi.fn();

    renderHook(() =>
      useModalAccessibility({
        isOpen: true,
        onClose,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
