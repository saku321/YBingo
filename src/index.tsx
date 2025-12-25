import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Main from './main';
import Menu from './components/menu';
import PopularIdeas from './components/popularIdeas';
import Login from './components/login';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CreateBingo from './components/createBingo';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './authProvider';


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
    <PopularIdeas/>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/bingoCreate" element={<CreateBingo />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
     </GoogleOAuthProvider>
  </React.StrictMode>
);
