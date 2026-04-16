import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBoards, createBoard as createBoardApi } from '../services/boardService';
import { useAuth } from '../context/AuthContext';
import { Plus, Layout, LogOut, Loader2, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '' });

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
  });

  const mutation = useMutation({
    mutationFn: createBoardApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['boards']);
      setShowModal(false);
      setNewBoard({ title: '', description: '' });
    },
  });

  const handleCreateBoard = (e) => {
    e.preventDefault();
    if (!newBoard.title.trim()) return;
    mutation.mutate(newBoard);
  };

  if (isLoading) return <div className="loading-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="dashboard-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Welcome, {user?.name}!</h1>
          <p className="text-muted">Manage your collaborative task boards</p>
        </div>
        <button onClick={logout} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layout size={24} className="text-primary" /> Your Boards
          </h2>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> New Board
          </button>
        </div>

        <div className="board-grid">
          {boards.map(board => (
            <div 
              key={board._id} 
              className="glass-panel board-card" 
              style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => navigate(`/boards/${board._id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{board.title}</h3>
                <ExternalLink size={16} className="text-muted" />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', height: '3rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {board.description || 'No description provided.'}
              </p>
              <div style={{ fontSize: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                Owner: {board.owner?.name === user?.name ? 'You' : board.owner?.name}
              </div>
            </div>
          ))}
          
          {boards.length === 0 && (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center' }}>
              <p className="text-muted">No boards found. Create your first board to get started!</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Create Board Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Board</h2>
            <form onSubmit={handleCreateBoard}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Board Title</label>
                <input 
                  autoFocus
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'white' }}
                  value={newBoard.title}
                  onChange={e => setNewBoard({...newBoard, title: e.target.value})}
                  placeholder="e.g., Marketing Project"
                />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                <textarea 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'white', minHeight: '100px' }}
                  value={newBoard.description}
                  onChange={e => setNewBoard({...newBoard, description: e.target.value})}
                  placeholder="What is this board about?"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>Cancel</button>
                <button type="submit" disabled={mutation.isPending} className="btn-primary">
                  {mutation.isPending ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
