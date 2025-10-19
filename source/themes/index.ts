import { Theme, ThemeColors } from '../types/index.js';

export const themes: Record<Theme, ThemeColors> = {
  default: {
    primary: '#00D9FF',
    secondary: '#7B68EE',
    accent: '#FF6B9D',
    background: '#0A0E27',
    text: '#E0E0E0',
    success: '#00FF88',
    error: '#FF4757',
    warning: '#FFA502',
    info: '#00D9FF',
    border: '#2D3748',
  },
  cyberpunk: {
    primary: '#FF00FF',
    secondary: '#00FFFF',
    accent: '#FFFF00',
    background: '#0D0221',
    text: '#F0F0F0',
    success: '#39FF14',
    error: '#FF006E',
    warning: '#FFB800',
    info: '#00F0FF',
    border: '#8B00FF',
  },
  minimal: {
    primary: '#000000',
    secondary: '#333333',
    accent: '#666666',
    background: '#FFFFFF',
    text: '#1A1A1A',
    success: '#2ECC71',
    error: '#E74C3C',
    warning: '#F39C12',
    info: '#3498DB',
    border: '#E0E0E0',
  },
  ocean: {
    primary: '#0088CC',
    secondary: '#006699',
    accent: '#33CCFF',
    background: '#001529',
    text: '#E6F7FF',
    success: '#52C41A',
    error: '#FF4D4F',
    warning: '#FAAD14',
    info: '#1890FF',
    border: '#003A70',
  },
};

export const getTheme = (themeName: Theme): ThemeColors => {
  return themes[themeName] || themes.default;
};
