import { useEffect, useState } from 'react';

export function DebugAuth() {
  const [debug, setDebug] = useState<any>({
    token: 'Checking...',
    storageWorks: 'Testing...',
    cookies: 'Checking...'
  });

  useEffect(() => {
    const checkAuth = async () => {
      // Test localStorage
      let storageTest = 'BLOCKED';
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        storageTest = '✅ WORKS';
      } catch (e) {
        storageTest = '❌ BLOCKED';
      }

      // Get token
      const token = localStorage.getItem('authToken');
      
      // Check cookies
      const hasCookies = document.cookie.length > 0;
      
      setDebug({
        token: token ? `${token.substring(0, 30)}...` : '❌ NONE',
        tokenLength: token?.length || 0,
        storageWorks: storageTest,
        cookies: hasCookies ? '✅ Found' : '❌ None',
        browser: navigator.userAgent,
        timestamp: new Date().toLocaleTimeString()
      });
    };
    
    checkAuth();
    
    // Refresh every 3 seconds
    const interval = setInterval(checkAuth, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#000',
      color: '#0f0',
      padding: '12px',
      fontSize: '11px',
      zIndex: 99999,
      fontFamily: 'monospace',
      maxHeight: '200px',
      overflowY: 'auto',
      borderTop: '2px solid #0f0'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🔍 AUTH DEBUG</div>
      <div>Token: {debug.token}</div>
      <div>Length: {debug.tokenLength}</div>
      <div>Storage: {debug.storageWorks}</div>
      <div>Cookies: {debug.cookies}</div>
      <div>Time: {debug.timestamp}</div>
      <div style={{ fontSize: '9px', marginTop: '4px', opacity: 0.7 }}>
        {debug.browser?.substring(0, 50)}...
      </div>
    </div>
  );
}
