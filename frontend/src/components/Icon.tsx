// Минимальный набор иконок (stroke, 24x24). Позже можно заменить на lucide-react.
const PATHS: Record<string, string> = {
  dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  fields: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  soil: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  crop: 'M12 21v-9M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2-5-6-5 0 3 2 5 6 5z',
  weather: 'M7 18a4 4 0 010-8 5 5 0 019.6 1A3.5 3.5 0 0116.5 18z',
  tips: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z',
  reports: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7',
  settings: 'M12 9a3 3 0 100 6 3 3 0 000-6zM19 12l2-1-2-4-2 .5-1.5-1L15 4h-4l-.5 2.5-1.5 1L7 7l-2 4 2 1v2l-2 1 2 4 2-.5 1.5 1L11 20h4l.5-2.5 1.5-1 2 .5 2-4-2-1z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  bell: 'M6 16V11a6 6 0 1112 0v5l2 2H4zM10 21h4',
  menu: 'M4 7h16M4 12h16M4 17h16',
  flask: 'M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  cloud: 'M7 18a4 4 0 010-8 5 5 0 019.6 1A3.5 3.5 0 0116.5 18z',
  rain: 'M7 14a4 4 0 010-8 5 5 0 019.6 1A3.5 3.5 0 0116.5 14zM8 17l-1 3M12 17l-1 3M16 17l-1 3',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5',
  satellite: 'M4 20l4-4M7 13l4 4M13 7l4 4M9 9l6 6M16 3l5 5-4 4-5-5z',
  check: 'M5 12l5 5 9-10',
  logo:'M12 20V10M12 10c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2-5-6-5 0 3 2 5 6 5z',
};

export default function Icon({ name, size = 18 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.more} />
    </svg>
  );
}
