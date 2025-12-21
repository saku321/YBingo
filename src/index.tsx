import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Main from './main';
import Menu from './components/menu';
import PopularIdeas from './components/popularIdeas';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CreateBingo from './components/createBingo';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
    <Menu/>
    <PopularIdeas/>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/bingoCreate" element={<CreateBingo />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
