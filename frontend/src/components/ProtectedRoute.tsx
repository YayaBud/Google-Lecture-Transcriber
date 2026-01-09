import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api, tokenManager } from '../lib/api';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ✅ Check if we have a token in URL (OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        
        if (tokenFromUrl) {
          console.log('✅ Token found in URL during protected route check');
          tokenManager.set(tokenFromUrl);
          // Don't check auth yet, let the component handle it
          setIsAuthenticated(true);
          return;
        }

        // ✅ Check if we have a stored token
        const token = tokenManager.get();
        if (!token) {
          console.log('❌ No token found, redirecting to login');
          setIsAuthenticated(false);
          return;
        }

        // ✅ Verify token with backend
        console.log('🔍 Verifying token with backend...');
        const data = await api.getAuthStatus();
        
        console.log('Auth status response:', data);
        setIsAuthenticated(data.authenticated);
        
        if (!data.authenticated) {
          console.log('❌ Token invalid, clearing and redirecting');
          tokenManager.remove();
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        tokenManager.remove();
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [location.pathname]); // Re-check on route change

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
