import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import MitarbeiterPage from '@/pages/MitarbeiterPage';
import SchichtvorlagenPage from '@/pages/SchichtvorlagenPage';
import PatientenPage from '@/pages/PatientenPage';
import EinsatzplanungPage from '@/pages/EinsatzplanungPage';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="mitarbeiter" element={<MitarbeiterPage />} />
              <Route path="schichtvorlagen" element={<SchichtvorlagenPage />} />
              <Route path="patienten" element={<PatientenPage />} />
              <Route path="einsatzplanung" element={<EinsatzplanungPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
