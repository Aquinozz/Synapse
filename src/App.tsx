import React from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { RequireRole } from './auth/session';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { EmployeeApp } from './areas/employee/EmployeeApp';
import { PsychologistApp } from './areas/psychologist/PsychologistApp';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/entrar" element={<LoginPage />} />
      <Route
        path="/app/*"
        element={
          <RequireRole role="employee">
            <EmployeeApp />
          </RequireRole>
        }
      />
      <Route
        path="/psi/*"
        element={
          <RequireRole role="psychologist">
            <PsychologistApp />
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
