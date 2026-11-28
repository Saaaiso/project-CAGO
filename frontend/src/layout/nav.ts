export interface NavItem {
  path: string;
  label: string;   // английский ключ для t()
  short?: string;  // короткая подпись для нижней навигации
  icon: string;
  mobile?: boolean; // показывать в нижней навигации
}

export const NAV: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: 'dashboard', mobile: true },
  { path: '/fields', label: 'Fields', icon: 'fields', mobile: true },
  { path: '/soil', label: 'Soil Analysis', short: 'Soil', icon: 'soil', mobile: true },
  { path: '/crops', label: 'Crop Monitoring', icon: 'crop' },
  { path: '/weather', label: 'Weather', icon: 'weather' },
  { path: '/recommendations', label: 'Recommendations', icon: 'tips' },
  { path: '/reports', label: 'Reports', icon: 'reports' },
  { path: '/settings', label: 'Settings', icon: 'settings' },

];
