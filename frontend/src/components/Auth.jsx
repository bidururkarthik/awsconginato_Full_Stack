import React, { useState } from 'react';
import './Auth.css';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);

  const [isVerification, setIsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);

  const [resetData, setResetData] = useState({
    email: '',
    code: '',
    newPassword: ''
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      setMessage(data.message || 'Login successful!');
      
      // Pass the data up to App.jsx to handle state and routing
      if (onLogin && data.accessToken) {
        onLogin(data.user, {
          accessToken: data.accessToken,
          idToken: data.idToken,
          refreshToken: data.refreshToken
        });
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.username,
          email: registerData.email,
          password: registerData.password,
          address: registerData.address
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      setMessage(data.message || 'Registration successful! Check your email to verify.');
      console.log('Register Success:', data);
      setIsVerification(true); // Switch to verification UI
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          code: verificationCode
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }
      
      setMessage('Email verified successfully! You can now sign in.');
      setIsVerification(false);
      setIsLogin(true); // Switch to login after verification
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerData.email })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to resend code');
      setMessage('Verification code resent successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetData.email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send reset code');
      
      setMessage(data.message || 'Password reset code sent to email');
      setIsForgotPassword(false);
      setIsResetPassword(true); // Switch to code confirmation step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: resetData.email,
          code: resetData.code,
          newPassword: resetData.newPassword
         })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset password');
      
      setMessage(data.message || 'Password successfully reset! You can now sign in.');
      setIsResetPassword(false);
      setIsLogin(true); // Switch back to login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormFlow = isVerification || isForgotPassword || isResetPassword;

  return (
    <div className="auth-container">
      <div className={`auth-box ${isLogin && !isFormFlow ? 'login-active' : 'register-active'}`}>
        {!isFormFlow && (
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${isLogin ? 'active' : ''}`} 
              onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
            >
              Login
            </button>
            <button 
              className={`auth-tab ${!isLogin ? 'active' : ''}`} 
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
            >
              Register
            </button>
          </div>
        )}

        <div className="auth-content">
          {error && <div className="auth-alert auth-error">{error}</div>}
          {message && <div className="auth-alert auth-success">{message}</div>}

          {/* VERIFICATION FORM */}
          {isVerification && (
            <div className="auth-form active">
              <h2>Verify Email</h2>
              <p>We sent a code to {registerData.email}.</p>
              <form onSubmit={handleVerificationSubmit}>
                <div className="input-group">
                  <label>Verification Code</label>
                  <input 
                    type="text" 
                    name="code" 
                    placeholder="123456"
                    value={verificationCode} 
                    onChange={(e) => setVerificationCode(e.target.value)} 
                    required 
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify Now'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={handleResendCode}
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                  <span style={{ margin: '0 10px', color: '#475569' }}>|</span>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setIsVerification(false)}
                    disabled={loading}
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FORGOT PASSWORD FLOW */}
          {isForgotPassword && (
            <div className="auth-form active">
              <h2>Reset Password</h2>
              <p>Enter your email to receive a reset code.</p>
              <form onSubmit={handleForgotPasswordSubmit}>
                <div className="input-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="hello@example.com"
                    value={resetData.email} 
                    onChange={(e) => setResetData({...resetData, email: e.target.value})} 
                    required 
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Sending Code...' : 'Send Reset Code'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => { setIsForgotPassword(false); setIsLogin(true); }}
                    disabled={loading}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* RESET PASSWORD FLOW */}
          {isResetPassword && (
            <div className="auth-form active">
              <h2>Set New Password</h2>
              <p>Enter the code sent to your email.</p>
              <form onSubmit={handleResetPasswordSubmit}>
                <div className="input-group">
                  <label>Verification Code</label>
                  <input 
                    type="text" 
                    name="code" 
                    placeholder="123456"
                    value={resetData.code} 
                    onChange={(e) => setResetData({...resetData, code: e.target.value})} 
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    placeholder="••••••••"
                    value={resetData.newPassword} 
                    onChange={(e) => setResetData({...resetData, newPassword: e.target.value})} 
                    required 
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Resetting...' : 'Change Password'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => { setIsResetPassword(false); setIsLogin(true); }}
                    disabled={loading}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LOGIN FORM */}
          {!isFormFlow && (
            <div className={`auth-form login-form ${isLogin ? 'active' : ''}`}>
              <h2>Welcome Back</h2>
              <p>Enter your details to access your account.</p>
              <form onSubmit={handleLoginSubmit}>
                <div className="input-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="hello@example.com"
                    value={loginData.email} 
                    onChange={handleLoginChange} 
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    placeholder="••••••••"
                    value={loginData.password} 
                    onChange={handleLoginChange} 
                    required 
                  />
                </div>
                <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem' }}
                    onClick={() => { setIsForgotPassword(true); setIsLogin(false); }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            </div>
          )}

          {/* REGISTER FORM */}
          {!isFormFlow && (
            <div className={`auth-form register-form ${!isLogin ? 'active' : ''}`}>
              <h2>Create Account</h2>
              <p>Sign up to get started.</p>
              <form onSubmit={handleRegisterSubmit}>
                <div className="input-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    name="username" 
                    placeholder="johndoe123"
                    value={registerData.username} 
                    onChange={handleRegisterChange} 
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="hello@example.com"
                    value={registerData.email} 
                    onChange={handleRegisterChange} 
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Address</label>
                  <input 
                    type="text" 
                    name="address" 
                    placeholder="123 Main St, City, Country"
                    value={registerData.address} 
                    onChange={handleRegisterChange} 
                    required 
                  />
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      name="password" 
                      placeholder="••••••••"
                      value={registerData.password} 
                      onChange={handleRegisterChange} 
                      required 
                    />
                  </div>
                  <div className="input-group">
                    <label>Confirm Password</label>
                    <input 
                      type="password" 
                      name="confirmPassword" 
                      placeholder="••••••••"
                      value={registerData.confirmPassword} 
                      onChange={handleRegisterChange} 
                      required 
                    />
                  </div>
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="bg-shape shape1"></div>
      <div className="bg-shape shape2"></div>
    </div>
  );
};

export default Auth;
