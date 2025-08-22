import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6cb1575121b948c5baef96fa89d96f60',
  appName: 'tableserver',
  webDir: 'dist',
  server: {
    url: 'https://6cb15751-21b9-48c5-baef-96fa89d96f60.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    App: {
      launchUrl: 'https://6cb15751-21b9-48c5-baef-96fa89d96f60.lovableproject.com?forceHideBadge=true'
    },
    BluetoothLe: {
      displayStrings: {
        scanning: "Zoeken naar printers...",
        cancel: "Annuleren",
        availableDevices: "Beschikbare apparaten",
        noDeviceFound: "Geen apparaten gevonden"
      }
    }
  }
};

export default config;