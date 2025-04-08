import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { isolateMetaMaskAtStartup } from './utils/web3Utils';

// Immediately isolate MetaMask provider at the app startup
// before any other wallet interactions happen
try {
  isolateMetaMaskAtStartup();
} catch (error) {
  console.error('Error during MetaMask isolation at startup:', error);
}

// iOS keyboard detection and handling
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

if (isIOS) {
  // Add iOS class to body for CSS targeting
  document.body.classList.add('ios');
  
  // Detect keyboard visibility changes
  window.addEventListener('resize', () => {
    // If window height decreased significantly, keyboard is likely visible
    const keyboardVisible = window.innerHeight < window.outerHeight * 0.8;
    
    if (keyboardVisible) {
      document.documentElement.classList.add('ios-keyboard-open');
    } else {
      document.documentElement.classList.remove('ios-keyboard-open');
      // Force scroll to top when keyboard hides
      setTimeout(() => window.scrollTo(0, 0), 50);
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
