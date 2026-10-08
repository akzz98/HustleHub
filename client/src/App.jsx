import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import FreelancerDashboardPage from './pages/FreelancerDashboardPage';
import GigDetailPage from './pages/GigDetailPage';
import GigsPage from './pages/GigsPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ManageGigsPage from './pages/ManageGigsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/gigs" element={<GigsPage />} />
          <Route path="/gigs/:id" element={<GigDetailPage />} />
          <Route path="/my-gigs" element={<ManageGigsPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/dashboard" element={<FreelancerDashboardPage />} />
          {/* 8.8 graceful UI error handling */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
