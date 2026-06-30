import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar        from './components/Navbar';
import ConverterPage from './pages/ConverterPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Navigate to="/converter" />} />
        <Route path="/converter" element={<ConverterPage />} />
        <Route path="*"          element={<Navigate to="/converter" />} />
      </Routes>
    </BrowserRouter>
  );
}
