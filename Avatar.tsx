import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import i18n from './i18n'; // Import i18n configuration

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-bold text-xl">Loading...</div>}>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </Suspense>
  </React.StrictMode>
);
