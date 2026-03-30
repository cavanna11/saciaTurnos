// Configuración del tema White-Label
// Estos valores se cargan desde business_settings y se aplican como CSS custom properties

export const defaultTheme = {
  primaryColor: '#6366f1',
  primaryHover: '#4f46e5',
  primaryLight: '#eef2ff',
  secondaryColor: '#818cf8',
  accentColor: '#c084fc',
  bgColor: '#f8fafc',
  surfaceColor: '#ffffff',
  textColor: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  borderColor: '#e2e8f0',
  successColor: '#10b981',
  warningColor: '#f59e0b',
  dangerColor: '#ef4444',
};

export function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primaryColor || defaultTheme.primaryColor);
  root.style.setProperty('--primary-hover', theme.primaryHover || defaultTheme.primaryHover);
  root.style.setProperty('--primary-light', theme.primaryLight || defaultTheme.primaryLight);
  root.style.setProperty('--secondary', theme.secondaryColor || defaultTheme.secondaryColor);
  root.style.setProperty('--accent', theme.accentColor || defaultTheme.accentColor);
}
