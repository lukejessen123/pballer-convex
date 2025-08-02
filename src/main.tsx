console.log('PLM deploy version: v2');
console.log('PROD TEST 12345 - If you see this, the latest code is deployed!');

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Unregister all service workers for this domain (cleanup after removing PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
    if (registrations.length > 0) {
      console.log('Unregistered old service workers:', registrations.length);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexAuthProvider>
  </StrictMode>
);
