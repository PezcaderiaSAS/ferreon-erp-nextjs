import { describe, it, expect } from 'vitest';
import { DEFAULT_EMPRESA_CONFIG } from '../src/core/domain/entities/empresa-config';
import { THEME_PRESETS, resolveCompanyTheme, isValidHex } from '../src/core/domain/theme/theme-tokens';

describe('Gobernanza del Sistema de Diseño - Tríada Institucional & WCAG', () => {
  it('DEFAULT_EMPRESA_CONFIG debe tener predeterminado el tema salmon-pastel', () => {
    expect(DEFAULT_EMPRESA_CONFIG.temaColor).toBe('salmon-pastel');
  });

  it('La tríada institucional debe estar registrada con códigos HEX y tokens válidos', () => {
    const triadaIds = ['salmon-pastel', 'cyber-cyan', 'monochrome'] as const;

    triadaIds.forEach((id) => {
      const theme = THEME_PRESETS[id];
      expect(theme).toBeDefined();
      expect(theme.id).toBe(id);
      expect(isValidHex(theme.base)).toBe(true);
      expect(isValidHex(theme.dark)).toBe(true);
      expect(isValidHex(theme.light)).toBe(true);
      expect(['#FFFFFF', '#0F172A']).toContain(theme.textOnBase);
    });
  });

  it('resolveCompanyTheme debe priorizar config.temaColor sobre opciones legadas', () => {
    // 1. Salmon Pastel
    const resSalmon = resolveCompanyTheme({ temaColor: 'salmon-pastel', themeId: 'ocean' });
    expect(resSalmon.id).toBe('salmon-pastel');
    expect(resSalmon.base).toBe('#FF8A65');

    // 2. Cyber Cyan
    const resCyan = resolveCompanyTheme({ temaColor: 'cyber-cyan' });
    expect(resCyan.id).toBe('cyber-cyan');
    expect(resCyan.base).toBe('#0EA5E9');

    // 3. Monochrome
    const resMono = resolveCompanyTheme({ temaColor: 'monochrome' });
    expect(resMono.id).toBe('monochrome');
    expect(resMono.base).toBe('#18181B');
  });

  it('resolveCompanyTheme debe mantener compatibilidad con esquemas legados', () => {
    const legacySalmon = resolveCompanyTheme({ themeId: 'salmon' });
    expect(legacySalmon.id).toBe('salmon-pastel');

    const legacyOcean = resolveCompanyTheme({ themeId: 'ocean' });
    expect(legacyOcean.id).toBe('cyber-cyan');

    const legacySlate = resolveCompanyTheme({ themeId: 'slate' });
    expect(legacySlate.id).toBe('monochrome');
  });

  it('Los tokens de color deben cumplir con la armonía Corporate Clean', () => {
    const salmon = THEME_PRESETS['salmon-pastel'];
    expect(salmon.base).toBe('#FF8A65');
    expect(salmon.textOnBase).toBe('#FFFFFF');

    const cyan = THEME_PRESETS['cyber-cyan'];
    expect(cyan.base).toBe('#0EA5E9');
    expect(cyan.textOnBase).toBe('#FFFFFF');

    const mono = THEME_PRESETS['monochrome'];
    expect(mono.base).toBe('#18181B');
    expect(mono.textOnBase).toBe('#FFFFFF');
  });
});
