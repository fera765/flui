import { describe, it, expect } from 'vitest';
import { getTheme, themes } from '../themes/index';

describe('Themes', () => {
  it('should have all required themes', () => {
    expect(themes).toHaveProperty('default');
    expect(themes).toHaveProperty('cyberpunk');
    expect(themes).toHaveProperty('minimal');
    expect(themes).toHaveProperty('ocean');
  });

  it('should return theme colors', () => {
    const theme = getTheme('cyberpunk');
    expect(theme).toHaveProperty('primary');
    expect(theme).toHaveProperty('secondary');
    expect(theme).toHaveProperty('accent');
    expect(theme).toHaveProperty('background');
    expect(theme).toHaveProperty('text');
    expect(theme).toHaveProperty('success');
    expect(theme).toHaveProperty('error');
    expect(theme).toHaveProperty('warning');
    expect(theme).toHaveProperty('info');
    expect(theme).toHaveProperty('border');
  });

  it('should return default theme for unknown theme', () => {
    const theme = getTheme('unknown' as any);
    expect(theme).toEqual(themes.default);
  });

  it('should have valid color values', () => {
    Object.values(themes).forEach((theme) => {
      Object.values(theme).forEach((color) => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});
