import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

export function TaskCard({ task, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: task._id,
    data: {
      type: 'Task',
      task
    }
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="task-card"
    >
      <div className="task-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', marginRight: '0.5rem' }}>
          <GripVertical size={16} className="text-muted" />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{task.title}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{task.description}</p>
        </div>
        <button 
          onClick={() => onDelete(task._id)}
          style={{ padding: '0.25rem', background: 'transparent', color: 'var(--text-muted)' }}
          className="hover-danger"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
