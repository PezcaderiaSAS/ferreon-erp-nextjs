import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para salvaguardar formularios o modales con datos sin guardar (Dirty state).
 * Intercepta intentos de cierre como 'Escape', 'Backdrop', 'Botón X' y 'window.onbeforeunload'.
 */
export function useDirtyFormGuard(isDirty: boolean) {
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // 1. Interceptar evento de navegador (cierre de pestaña o recarga)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Necesario para navegadores modernos (Chrome, Firefox, Safari)
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // 2. Método para intentar ejecutar el cierre. Retorna 'false' si se bloqueó, 'true' si pasó.
  const attemptAction = useCallback((action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
      setShowDiscardModal(true);
      return false;
    }
    action();
    return true;
  }, [isDirty]);

  // 3. El usuario confirma que quiere descartar los cambios
  const confirmDiscard = useCallback(() => {
    setShowDiscardModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  // 4. El usuario cancela el descarte (quiere seguir editando)
  const cancelDiscard = useCallback(() => {
    setShowDiscardModal(false);
    setPendingAction(null);
  }, []);

  return {
    showDiscardModal,
    attemptAction,
    confirmDiscard,
    cancelDiscard
  };
}
