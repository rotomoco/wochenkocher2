import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import IndexView from './views/IndexView';
import WochenplanungView from './views/WochenplanungView';
import EinkaufslisteView from './views/EinkaufslisteView';
import GerichteView from './views/GerichteView';
import ZutatenView from './views/ZutatenView';
import EinstellungenView from './views/EinstellungenView';
import SucheView from './views/SucheView';
import TagesgerichtView from './views/TagesgerichtView';
import NeuesGerichtView from './views/NeuesGerichtView';
import TagsView from './views/TagsView';
import LoginView from './views/LoginView';
import ProfileView from './views/ProfileView';
import { useAuth } from './contexts/AuthContext';
import { scheduleNotifications } from './lib/notifications';

function App() {
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      scheduleNotifications();
    }
  }, [session]);

  if (!session) {
    return (
      <ErrorBoundary>
        <LoginView />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Router basename="/wochenkocher">
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              marginTop: '4rem',
              background: '#fff',
              color: '#363636',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: '1rem',
              borderRadius: '0.5rem',
            },
          }}
        />
        <Layout>
          <Routes>
            <Route path="/" element={<IndexView />} />
            <Route path="/wochenplanung" element={<WochenplanungView />} />
            <Route path="/einkaufsliste" element={<EinkaufslisteView />} />
            <Route path="/gerichte" element={<GerichteView />} />
            <Route path="/zutaten" element={<ZutatenView />} />
            <Route path="/einstellungen" element={<EinstellungenView />} />
            <Route path="/suche" element={<SucheView />} />
            <Route path="/gericht/:id" element={<TagesgerichtView />} />
            <Route path="/neues-gericht" element={<NeuesGerichtView />} />
            <Route path="/tags" element={<TagsView />} />
            <Route path="/profil" element={<ProfileView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;