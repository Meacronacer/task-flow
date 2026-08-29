import { type FC } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { KanbanBoard } from '@widgets/kanban-board';
import { useColumns, useCreateColumn, useDeleteColumn } from '@entities/column/api';
import { useProjectTasks, useCreateTask, useMoveTask } from '@entities/task/api';
import type { Task } from '@entities/task/model/types';

export const BoardPage: FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: columns = [], isLoading: columnsLoading } = useColumns(projectId ?? '');
  const { data: tasks = [], isLoading: tasksLoading } = useProjectTasks(projectId ?? '');

  const createColumn = useCreateColumn(projectId ?? '');
  const deleteColumn = useDeleteColumn(projectId ?? '');
  const createTask = useCreateTask(projectId ?? '');
  const moveTask = useMoveTask(projectId ?? '');

  if (!projectId) {
    return <Navigate to='/' replace />;
  }

  function handleAddColumn(title: string): void {
    createColumn.mutate({ title, position: columns.length });
  }

  function handleDeleteColumn(columnId: string): void {
    if (!confirm('Delete this column and all its tasks?')) return;
    deleteColumn.mutate(columnId);
  }

  function handleAddTask(columnId: string, title: string): void {
    createTask.mutate({ title, columnId });
  }

  function handleMoveTask(taskId: string, columnId: string, position: number): void {
    moveTask.mutate({ taskId, dto: { columnId, position } });
  }

  function handleTaskClick(task: Task): void {
    console.log('task clicked', task.id);
  }

  if (columnsLoading || tasksLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-slate-400 text-sm'>Loading board...</div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-screen bg-[var(--color-bg)]'>
      <div className='flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => navigate('/dashboard')}
            className='text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-sm'
          >
            ← Back
          </button>
          <h1 className='text-lg font-semibold text-[var(--color-text)]'>Board</h1>
        </div>
      </div>

      <div className='flex-1 overflow-hidden p-6'>
        <KanbanBoard
          projectId={projectId}
          columns={columns}
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
          onMoveTask={handleMoveTask}
          onDeleteColumn={handleDeleteColumn}
          onAddColumn={handleAddColumn}
        />
      </div>
    </div>
  );
};