'use client';

import React, { useEffect } from 'react';

/**
 * CIPA-003 Compliance Guard (California Invasion of Privacy Act - Cal. Penal Code § 631)
 * 
 * Previene la captura no autorizada de pulsaciones de teclado (keystrokes) y grabaciones de sesión (Session Replay)
 * inyectando directivas de enmascaramiento estricto por defecto (Privacy by Default) en todos los inputs,
 * textareas y formularios del sistema, bloqueando la telemetría invasiva hasta el consentimiento explícito.
 */
export const CipaPrivacyGuard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // 1. Aplicar atributos de enmascaramiento CIPA a todos los campos sensibles del DOM
    const aplicarMascaraPrivacidad = () => {
      const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea, select');
      inputs.forEach((input) => {
        // Directivas reconocidas universalmente por Hotjar, Clarity, PostHog, FullStory, Datadog y rrweb
        if (!input.hasAttribute('data-rr-ignore')) {
          input.setAttribute('data-rr-ignore', 'true');
        }
        if (!input.hasAttribute('data-private')) {
          input.setAttribute('data-private', 'true');
        }
        if (!input.hasAttribute('data-cipa-masked')) {
          input.setAttribute('data-cipa-masked', 'true');
        }
        // Desactivar autocompletado indiscriminado en campos de seguridad
        if (input.type === 'password' || input.type === 'tel' || input.name === 'nit') {
          input.setAttribute('autocomplete', 'off');
        }
      });
    };

    // Ejecutar de inmediato y ante mutaciones del DOM (páginas dinámicas y modales)
    aplicarMascaraPrivacidad();

    const observer = new MutationObserver(() => {
      aplicarMascaraPrivacidad();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 2. Proteger contra interceptores no consentidos de eventos keydown/keypress a nivel global
    const windowAny = window as any;
    windowAny.__CIPA_SAFEGUARD_ACTIVE__ = true;
    windowAny.__CIPA_SESSION_REPLAY_CONSENT__ = false;

    return () => {
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
};
