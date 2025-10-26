import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./mobile.css";
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

// Initialize Capacitor plugins (silently fail on web)
if (import.meta.env.PROD) {
  // Status bar configuration (mobile only)
  StatusBar.setStyle({ style: Style.Light }).catch(() => {
    // Silently fail on web
  });
  StatusBar.setBackgroundColor({ color: '#1a73e8' }).catch(() => {
    // Silently fail on web
  });
  
  // Hide splash screen after app loads (mobile only)
  SplashScreen.hide().catch(() => {
    // Silently fail on web
  });
  
  // Keyboard configuration for RTL (mobile only)
  Keyboard.setAccessoryBarVisible({ isVisible: true }).catch(() => {
    // Silently fail on web
  });
  
  // App state listeners
  CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    console.log('App state changed. Is active?', isActive);
  }).catch(() => {
    // Silently fail on web
  });
}

createRoot(document.getElementById("root")!).render(<App />);
