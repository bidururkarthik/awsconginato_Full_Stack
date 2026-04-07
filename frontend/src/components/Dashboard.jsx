import React, { useEffect, useState } from 'react';

const Dashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Basic user extraction from local storage (or ID token if desired)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user details");
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      // Clear storage and redirect regardless of API success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      onLogout();
    }
  };

  return (
    <div style={{ padding: '3rem', fontFamily: 'Inter, sans-serif', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Welcome to your protected area.</p>
      
      <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1rem', color: '#0f172a' }}>Profile Information</h2>
        {user ? (
          <div>
            <p><strong>Name:</strong> {user.name || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
          </div>
        ) : (
          <p>Loading user profile...</p>
        )}
      </div>

      <button 
        onClick={handleLogout}
        style={{
          background: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        Sign Out
      </button>
    </div>
  );
};

export default Dashboard;
