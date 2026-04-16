import api from './api';

export const getBoards = () => api.get('/boards').then(res => res.data.boards);
export const getBoardById = (id) => api.get(`/boards/${id}`).then(res => res.data.board);
export const createBoard = (data) => api.post('/boards', data).then(res => res.data.board);
export const inviteMember = (boardId, email) => api.post(`/boards/${boardId}/members`, { email }).then(res => res.data);
