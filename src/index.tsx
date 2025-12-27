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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID!;


root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
    <AuthProvider>
    <BrowserRouter>
    <Menu/>
    
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/bingoCreate" element={<CreateBingo />} />
        <Route path="/login" element={<Login />} />
         <Route path="/yourCards" element={<YourCards />} />
         <Route path="/card/:cardId" element={<SharedBingo />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
     </GoogleOAuthProvider>
  </React.StrictMode>
);
