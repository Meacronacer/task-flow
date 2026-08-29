import { type FC } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskPriority } from '../model/types';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

interface PriorityConfig {
  label: string;
  className: string;
}


const priorityConfig: Record<TaskPriority, PriorityConfig> = {
  low: { label: 'Low', className: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
};

function formatDeadline(deadline: string | null): string | null {
  if (!deadline) return null;
  return new Date(deadline).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

export const TaskCard: FC<TaskCardProps> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityConfig[task.priority];
  const deadline = formatDeadline(task.deadline);
  const overdue = isOverdue(task.deadline);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={[
        'bg-[var(--color-surface-2)] rounded-lg border border-[var(--color-border)] p-3 cursor-pointer',
        'hover:border-indigo-500/50 hover:shadow-sm transition-all select-none',
        isDragging ? 'opacity-50 shadow-lg rotate-1' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className='flex items-center justify-between mb-2'>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.className}`}
        >
          {priority.label}
        </span>

        {deadline && (
          <span
            className={`text-xs ${overdue ? 'text-red-400 font-medium' : 'text-[var(--color-text-muted)]'}`}
          >
            {overdue ? '⚠ ' : ''}
            {deadline}
          </span>
        )}
      </div>

      <p className='text-sm font-medium text-[var(--color-text)] leading-snug mb-2'>
        {task.title}
      </p>

      {task.assignee && (
        <div className='flex items-center gap-1.5 mt-2'>
          <div className='w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center'>
            <span className='text-white text-[10px] font-bold'>
              {task.assignee.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className='text-xs text-[var(--color-text-muted)]'>{task.assignee.name}</span>
        </div>
      )}
    </div>
  );
};