import api from './api';

export const getTasksByBoard = (boardId) => api.get(`/tasks/board/${boardId}`).then(res => res.data.tasks);
export const createTask = (data) => api.post('/tasks', data).then(res => res.data.task);
export const moveTask = (id, destinationStatus, newPosition) => 
  api.patch(`/tasks/${id}/move`, { destinationStatus, newPosition }).then(res => res.data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then(res => res.data);
