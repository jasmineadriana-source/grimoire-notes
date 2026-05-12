import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.grimoirenotes',
  appName: 'grimoire-notes',
  webDir: 'dist',
  server: {
    url: 'https://7769a3a5-a9b3-44ee-b779-fe5cb85d9fcd.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;