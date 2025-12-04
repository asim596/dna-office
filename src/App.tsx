import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { Header } from './components/Header';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Home } from './pages/Home';
import { useAuthStore } from './stores/authStore';
import FamilyTreeDashboard from './components/FamilyTreeDashboard';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route 
                path="/login" 
                element={!isAuthenticated ? <LoginForm /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/register" 
                element={!isAuthenticated ? <RegisterForm /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/trees" 
                element={isAuthenticated ? <FamilyTreeDashboard /> : <Navigate to="/login" replace />} 
              />
              <Route path="/research" element={<div>Research Tools - Coming Soon</div>} />
              <Route path="/dna" element={<div>DNA Dashboard - Coming Soon</div>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
