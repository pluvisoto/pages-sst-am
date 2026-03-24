import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import PartnerLandingPage from './components/PartnerLandingPage.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <PartnerLandingPage />
    </ErrorBoundary>
  </StrictMode>,
);
