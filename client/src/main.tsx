import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./mobile.css";
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

// Initialize Capacitor plugins
if (import.meta.env.PROD) {
  // Status bar configuration
  StatusBar.setStyle({ style: Style.Light });
  StatusBar.setBackgroundColor({ color: '#1a73e8' });
  
  // Hide splash screen after app loads
  SplashScreen.hide();
  
  // Keyboard configuration for RTL
  Keyboard.setAccessoryBarVisible({ isVisible: true });
  
  // App state listeners
  CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    console.log('App state changed. Is active?', isActive);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
