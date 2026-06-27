import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar        from './components/Navbar';
import LoginPage     from './pages/LoginPage';
import SignupPage    from './pages/SignupPage';
import ConverterPage from './pages/ConverterPage';

const Protected = ({ children }) =>
  localStorage.getItem('token') ? children : <Navigate to="/login" />;

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Navigate to="/converter" />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/signup"    element={<SignupPage />} />
        <Route path="/converter" element={<Protected><ConverterPage /></Protected>} />
      </Routes>
    </BrowserRouter>
  );
}
