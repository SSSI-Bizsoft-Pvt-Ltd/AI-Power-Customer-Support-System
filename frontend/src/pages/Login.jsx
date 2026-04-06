import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, LogIn, Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', position: 'relative' }}>
        
        {/* Decorative elements */}
        <div style={{ 
          position: 'absolute', top: '-40px', left: '-40px', 
          width: '100px', height: '100px', 
          background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(40px)', zIndex: -1 
        }} />
        
        <div className="flex flex-col items-center gap-4" style={{ marginBottom: '2rem' }}>
          <div style={{ 
            background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', 
            borderRadius: '50%', border: '1px solid var(--accent-glow)' 
          }}>
            <Bot size={40} color="var(--accent-color)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 className="text-xl font-semibold text-gradient" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Support Engine</h1>
            <p className="text-sm text-secondary">Authenticate to access the dashboard</p>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input type="email" className="input-glass" placeholder="Email Address" style={{ paddingLeft: '2.5rem' }} required />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input type="password" className="input-glass" placeholder="Password" style={{ paddingLeft: '2.5rem' }} required />
          </div>
          <button type="submit" className="btn-primary flex items-center justify-center gap-2" style={{ marginTop: '1rem' }}>
            <LogIn size={20} />
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a href="#" className="text-sm">Forgot password?</a>
        </div>
      </div>
    </div>
  );
}
