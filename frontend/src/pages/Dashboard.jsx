import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, MessageSquare, Settings, LogOut, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

function Overview() {
  const [metrics, setMetrics] = useState({ totalMessages: 0, autoQualifiedTasks: 0, actionRequired: 0 });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      try {
        const [metricsRes, tasksRes] = await Promise.all([
          axios.get(`${baseURL}/api/tasks/metrics`),
          axios.get(`${baseURL}/api/tasks`)
        ]);
        setMetrics(metricsRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Auto refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <header className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 700 }}>Overview</h1>
          <p className="text-secondary">AI Task Qualification Status</p>
        </div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card flex items-center gap-4">
          <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-color)' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="text-secondary text-sm">Total Messages</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{loading ? '...' : metrics.totalMessages}</div>
          </div>
        </div>
        
        <div className="glass-card flex items-center gap-4">
          <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-secondary text-sm">Auto-Qualified Tasks</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{loading ? '...' : metrics.autoQualifiedTasks}</div>
          </div>
        </div>
        
        <div className="glass-card flex items-center gap-4">
          <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-secondary text-sm">Action Required</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{loading ? '...' : metrics.actionRequired}</div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        <h2 style={{ marginBottom: '1rem', fontWeight: 600 }}>Recent Activities</h2>
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="text-secondary">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-secondary">No tasks logged yet. Waiting for WhatsApp messages...</div>
          ) : (
            tasks.slice(0, 10).map((task) => (
              <div key={task.id} className="flex justify-between items-center" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                <div className="flex items-center gap-4">
                  <Clock size={16} color="var(--text-secondary)" />
                  <div>
                    <div className="font-semibold text-sm">[{task.category}] {task.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.1rem 0.6rem', 
                        borderRadius: '4px', 
                        background: task.priority === 'High' ? 'rgba(239, 68, 68, 0.2)' : task.priority === 'Medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#10b981',
                        border: `1px solid ${task.priority === 'High' ? 'rgba(239, 68, 68, 0.3)' : task.priority === 'Medium' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                      }}>
                        {task.priority || 'Low'}
                      </span>
                      <div className="text-secondary text-sm" style={{ fontSize: '0.75rem' }}>Sender: {task.sender_phone}</div>
                    </div>
                  </div>
                </div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '999px', 
                  background: task.status === 'Resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)', 
                  color: task.status === 'Resolved' ? '#10b981' : 'var(--accent-color)',
                  border: `1px solid ${task.status === 'Resolved' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`
                }}>
                  {task.status || 'New'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ 
        width: '260px', padding: '1.5rem', display: 'flex', flexDirection: 'column', 
        borderRight: '1px solid var(--panel-border)', borderTop: 'none', borderBottom: 'none', borderLeft: 'none', borderRadius: 0,
        zIndex: 10
      }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '3rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' }}>
            <MessageSquare size={18} color="white" />
          </div>
          <span className="font-semibold text-lg" style={{ letterSpacing: '0.5px' }}>SupportAI</span>
        </div>
        
        <nav className="flex flex-col gap-2" style={{ flex: 1 }}>
          <a href="#" className="flex items-center gap-3" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.15)', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <LayoutDashboard size={20} color="var(--accent-color)" />
            <span className="font-semibold text-sm">Overview</span>
          </a>
          <a href="#" className="flex items-center gap-3 text-secondary hover:text-white transition-colors" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <MessageSquare size={20} />
            <span className="font-semibold text-sm">Tasks</span>
          </a>
          <a href="#" className="flex items-center gap-3 text-secondary hover:text-white transition-colors" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <Settings size={20} />
            <span className="font-semibold text-sm">Settings</span>
          </a>
        </nav>
        
        <button className="flex items-center gap-3 text-secondary hover:text-danger transition-colors" style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }} onClick={() => navigate('/login')}>
          <LogOut size={20} />
          <span className="font-semibold text-sm">Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<Overview />} />
        </Routes>
      </main>
    </div>
  );
}
