import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DndContext, 
  DragOverlay, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  closestCorners,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { getBoardById, inviteMember } from '../services/boardService';
import { getTasksByBoard, moveTask, createTask, deleteTask } from '../services/taskService';
import { useSocket } from '../socket/SocketProvider';
import { Column } from '../components/Column';
import { TaskCard } from '../components/TaskCard';
import { Modal } from '../components/Modal';
import { Loader2, ArrowLeft, Users, Plus, Send } from 'lucide-react';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'DONE'];

export default function BoardPage() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { joinBoard } = useSocket();

  const [activeTask, setActiveTask] = useState(null);
  
  // Modals state
  const [showAddTask, setShowAddTask] = useState(false);
  const [targetColumn, setTargetColumn] = useState('TODO');
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  const [showMembers, setShowMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // ─── Queries ────────────────────────────────────────────────────────────────
  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => getBoardById(boardId),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', boardId],
    queryFn: () => getTasksByBoard(boardId),
  });

  // ─── Realtime Sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (boardId) joinBoard(boardId);
  }, [boardId, joinBoard]);

  // ─── Drag & Drop Sensors ────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  // ─── DND Handlers ───────────────────────────────────────────────────────────
  const onDragStart = (event) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const onDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== 'Task') return;

    let destStatus = activeData.task.status;
    let newPosition = 0;

    if (overData.type === 'Column') {
      destStatus = overData.columnId;
      const columnTasks = tasks.filter(t => t.status === destStatus);
      newPosition = columnTasks.length;
    } else if (overData.type === 'Task') {
      destStatus = overData.task.status;
      const columnTasks = tasks.filter(t => t.status === destStatus);
      newPosition = columnTasks.findIndex(t => t._id === overId);
    }

    if (destStatus === activeData.task.status && newPosition === activeData.task.position) return;

    try {
      await moveTask(activeId, destStatus, newPosition);
    } catch (err) {
      console.error('Failed to move task:', err);
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    }
  };

  // ─── Task Management ────────────────────────────────────────────────────────
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await createTask({ boardId, title: newTask.title, description: newTask.description, status: targetColumn });
      setShowAddTask(false);
      setNewTask({ title: '', description: '' });
    } catch (err) { alert('Failed to create task'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
    } catch (err) { alert('Failed to delete task'); }
  };

  // ─── Member Management ──────────────────────────────────────────────────────
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember(boardId, inviteEmail);
      alert('Member invited!');
      setInviteEmail('');
      queryClient.invalidateQueries(['board', boardId]); // Refresh member list
    } catch (err) { alert(err.response?.data?.message || 'Failed to invite'); }
  };

  const tasksByColumn = useMemo(() => {
    const grouped = { TODO: [], IN_PROGRESS: [], DONE: [] };
    tasks.forEach(t => {
      if (grouped[t.status]) grouped[t.status].push(t);
    });
    return grouped;
  }, [tasks]);

  if (boardLoading || tasksLoading) {
    return <div className="loading-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="board-page">
      <header style={{ 
        display: 'flex', 
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '1rem',
        marginBottom: '2rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} className="glass-panel" style={{ padding: '0.6rem' }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ maxWidth: '60vw' }}>
            <h1 style={{ fontSize: 'calc(1.2rem + 0.5vw)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{board?.title}</h1>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>{board?.description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setShowMembers(true)} className="btn-secondary">
            <Users size={16} /> <span className="hide-mobile">Members ({board?.members?.length + 1})</span>
          </button>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="kanban-board">
          {COLUMNS.map(colId => (
            <Column
              key={colId}
              id={colId}
              title={colId.toLowerCase()}
              tasks={tasksByColumn[colId]}
              onAddTask={(status) => {
                setTargetColumn(status);
                setShowAddTask(true);
              }}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: '0.5' } }
          })
        }}>
          {activeTask ? <TaskCard task={activeTask} onDelete={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      {/* ─── Add Task Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={showAddTask} onClose={() => setShowAddTask(false)} title="Create New Task">
        <form onSubmit={handleSaveTask}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Task Title</label>
            <input 
              autoFocus
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'white' }}
              value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="e.g., Update documentation"
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
            <textarea 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'white', minHeight: '100px' }}
              value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Provide more context..."
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowAddTask(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>Cancel</button>
            <button type="submit" className="btn-primary">Create Task</button>
          </div>
        </form>
      </Modal>

      {/* ─── Members Modal ────────────────────────────────────────────────────── */}
      <Modal isOpen={showMembers} onClose={() => setShowMembers(false)} title="Board Members">
        <div style={{ marginBottom: '2rem' }}>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Manage who can collaborate on this board.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', background: '#34d399', borderRadius: '50%' }} title="Owner" />
              <span>{board?.owner?.name} <small className="text-muted">(Owner)</small></span>
            </div>
            {board?.members?.map(m => (
              <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%' }} />
                <span>{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleInvite} style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Invite New Member</h4>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'white' }}
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="Enter user email..."
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }}>
              <Send size={18} />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
