import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Main from './main';
import Menu from './components/menu';
import Login from './components/login';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CreateBingo from './components/createBingo';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './authProvider';
import YourCards from './components/yourCards';
import SharedBingo from './components/sharedBingo';
import Premium from './components/premium';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const paypalClientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
if (!googleClientId) {
  throw new Error('Missing REACT_APP_GOOGLE_CLIENT_ID environment variable');
}

if (!paypalClientId) {
  throw new Error('Missing REACT_APP_PAYPAL_CLIENT_ID environment variable');
}

const paypalOptions = {
  clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID ?? '',    // ← satisfies TypeScript
  'client-id': process.env.REACT_APP_PAYPAL_CLIENT_ID ?? '', // ← actually used by SDK
  currency: 'USD',
  intent: 'capture',
} as const; 

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <PayPalScriptProvider options={paypalOptions}>
        <AuthProvider>
          <BrowserRouter>
            <Menu />
            <Routes>
              <Route path="/" element={<Main />} />
              <Route path="/bingoCreate" element={<CreateBingo />} />
              <Route path="/login" element={<Login />} />
              <Route path="/yourCards" element={<YourCards />} />
              <Route path="/card/:cardId" element={<SharedBingo />} />
              <Route path="/premium" element={<Premium />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </PayPalScriptProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
