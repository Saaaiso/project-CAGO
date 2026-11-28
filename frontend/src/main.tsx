import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './components/Toast';
import { I18nProvider, LangBoundary } from './i18n';
import { FarmProvider } from './state/FarmContext';
import './styles/tokens.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <FarmProvider>
          <ToastProvider>
            <LangBoundary>
              <App />
            </LangBoundary>
          </ToastProvider>
        </FarmProvider>
      </BrowserRouter>
    </I18nProvider>
  </React.StrictMode>,
);
