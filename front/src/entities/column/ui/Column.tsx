import { type FC, useState } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from '@entities/task/ui/TaskCard';
import type { Column as ColumnType } from '../model/types';
import type { Task } from '@entities/task/model/types';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const Column: FC<ColumnProps> = ({
  column,
  tasks,
  onTaskClick,
  onAddTask,
  onDeleteColumn,
}) => {
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  function handleAddSubmit(): void {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    onAddTask(column.id, trimmed);
    setNewTaskTitle('');
    setAddingTask(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddSubmit();
    }
    if (e.key === 'Escape') {
      setAddingTask(false);
      setNewTaskTitle('');
    }
  }

  return (
    <div className='flex flex-col w-72 shrink-0'>
      <div className='flex items-center justify-between mb-2 px-1'>
        <div className='flex items-center gap-2'>
          <h3 className='font-semibold text-sm text-[var(--color-text)]'>
            {column.title}
          </h3>
          <span className='text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded-full'>
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onDeleteColumn(column.id)}
          className='text-[var(--color-text-muted)] hover:text-red-400 transition-colors text-lg leading-none'
          title='Delete column'
        >
          ×
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={[
          'flex flex-col gap-2 flex-1 min-h-16 rounded-xl p-2 transition-colors',
          isOver
            ? 'bg-indigo-500/10 border border-indigo-500/30'
            : 'bg-[var(--color-surface)]',
        ].join(' ')}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {addingTask ? (
          <div className='bg-[var(--color-surface-2)] rounded-lg border border-[var(--color-border)] p-2'>
            <textarea
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Task title...'
              rows={2}
              className='w-full text-sm text-[var(--color-text)] bg-transparent resize-none outline-none placeholder:text-[var(--color-text-muted)]'
            />
            <div className='flex gap-1.5 mt-1.5'>
              <button
                onClick={handleAddSubmit}
                className='text-xs bg-[var(--color-primary)] text-white px-2.5 py-1 rounded-md hover:bg-[var(--color-primary-hover)] transition-colors'
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAddingTask(false);
                  setNewTaskTitle('');
                }}
                className='text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-2 py-1 transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className='text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg py-1.5 px-2 text-left transition-colors'
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  );
};