import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { JobFeed } from './pages/JobFeed';
import { Applications } from './pages/Applications';
import { PortalSelection } from './pages/PortalSelection';
import { Preferences } from './pages/Preferences';
import { Analytics } from './pages/Analytics';
import { Schedule } from './pages/Schedule';

function App() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <DashboardHome />;
      case 'jobs':
        return <JobFeed />;
      case 'applications':
        return <Applications />;
      case 'portals':
        return <PortalSelection />;
      case 'preferences':
        return <Preferences />;
      case 'analytics':
        return <Analytics />;
      case 'schedule':
        return <Schedule />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>
  );
}

export default App;
