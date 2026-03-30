import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BusinessProvider } from './contexts/BusinessContext';
import { AuthProvider } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BusinessProvider>
      <AuthProvider>
        <BookingProvider>
          <App />
        </BookingProvider>
      </AuthProvider>
    </BusinessProvider>
  </StrictMode>
);
