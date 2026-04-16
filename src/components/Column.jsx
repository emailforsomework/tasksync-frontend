import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

export function Column({ id, title, tasks, onAddTask, onDeleteTask }) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'Column',
      columnId: id
    }
  });

  return (
    <div className="kanban-column">
      <div className="column-header">
        <h3 style={{ textTransform: 'capitalize' }}>{title.replace('_', ' ')}</h3>
        <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{tasks.length}</span>
      </div>

      <div 
        ref={setNodeRef} 
        style={{ minHeight: '100px', display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <SortableContext 
          id={id}
          items={tasks.map(t => t._id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskCard 
              key={task._id} 
              task={task} 
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>
      </div>

      <button 
        onClick={() => onAddTask(id)}
        style={{ 
          width: '100%', 
          marginTop: '1rem', 
          background: 'rgba(255,255,255,0.05)', 
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem'
        }}
        className="btn-add-task hover-primary"
      >
        <Plus size={16} /> Add Task
      </button>
    </div>
  );
}
