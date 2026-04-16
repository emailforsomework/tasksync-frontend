import React from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-panel modal-content" style={{
        width: '100%',
        margin: '0 auto',
        maxWidth: '450px',
        padding: '1.5rem',
        animation: 'modalSlideUp 0.3s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', padding: '0.25rem', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
