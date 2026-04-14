import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FormPage from './pages/FormPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import { Toaster } from 'sonner';
import AdminGuard from './components/AdminGuard';

function App() {
  return (
    <Router>
      <div className="min-h-screen text-slate-200">
        <Routes>
          <Route path="/" element={<FormPage />} />
          <Route path="/admin" element={
            <AdminGuard>
              <DashboardPage />
            </AdminGuard>
          } />
          <Route path="/admin/settings" element={
            <AdminGuard>
              <SettingsPage />
            </AdminGuard>
          } />
        </Routes>
        <Toaster position="top-right" theme="dark" richColors />
      </div>
    </Router>
  );
}

export default App;
