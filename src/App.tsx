import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FormPage from './pages/FormPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <div className="min-h-screen text-slate-200">
        <Routes>
          <Route path="/" element={<FormPage />} />
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Routes>
        <Toaster position="top-right" theme="dark" richColors />
      </div>
    </Router>
  );
}

export default App;
