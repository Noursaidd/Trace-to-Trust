import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LandingPage } from '@/app/pages/LandingPage';
import { ProducerDashboard } from '@/app/pages/ProducerDashboard';
import { VerifyPage } from '@/app/pages/VerifyPage';
import { I18nProvider } from '@/app/lib/i18n';
import { ThemeProvider } from '@/app/lib/theme';

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/verify/:code" element={<VerifyPage />} />
            <Route path="/admin" element={<ProducerDashboard />} />
            <Route path="/dashboard" element={<ProducerDashboard />} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}
