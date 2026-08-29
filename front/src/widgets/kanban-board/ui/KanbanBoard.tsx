import { type FC, useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Column } from '@entities/column/ui/Column';
import { TaskCard } from '@entities/task/ui/TaskCard';
import type { Column as ColumnType } from '@entities/column/model/types';
import type { Task } from '@entities/task/model/types';

interface KanbanBoardProps {
  projectId: string;
  columns: ColumnType[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string, title: string) => void;
  onMoveTask: (taskId: string, columnId: string, position: number) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddColumn: (title: string) => void;
}

export const KanbanBoard: FC<KanbanBoardProps> = ({
  columns,
  tasks,
  onTaskClick,
  onAddTask,
  onMoveTask,
  onDeleteColumn,
  onAddColumn,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dragTasks, setDragTasks] = useState<Task[] | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  // ID of the moved task — for tracking the server response
  const [movedTaskId, setMovedTaskId] = useState<string | null>(null);

  // We use dragTasks until the server returns the updated task.
  // As soon as the tasks from props contain a task with the new position/column,
  // dragTasks is no longer needed; we use the server data.
  const displayTasks = useMemo(() => {
    if (!dragTasks || !movedTaskId) return tasks;

    const dragVersion = dragTasks.find((t) => t.id === movedTaskId);
    const serverVersion = tasks.find((t) => t.id === movedTaskId);

    if (
      dragVersion &&
      serverVersion &&
      dragVersion.columnId === serverVersion.columnId &&
      dragVersion.position === serverVersion.position
    ) {
      // The server responded and the data matches — switching to the server data
      return tasks;
    }

    return dragTasks;
  }, [dragTasks, tasks, movedTaskId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns],
  );

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const col of sortedColumns) {
      map.set(
        col.id,
        displayTasks
          .filter((t) => t.columnId === col.id)
          .sort((a, b) => a.position - b.position),
      );
    }
    return map;
  }, [sortedColumns, displayTasks]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) {
        setActiveTask(task);
        setDragTasks([...tasks]);
      }
    },
    [tasks],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      if (activeId === overId) return;

      setDragTasks((prev) => {
        const current = prev ?? tasks;
        const dragged = current.find((t) => t.id === activeId);
        if (!dragged) return current;

        const overTask = current.find((t) => t.id === overId);
        const targetColumnId = overTask ? overTask.columnId : overId;

        const isValidColumn = columns.some((c) => c.id === targetColumnId);
        if (!isValidColumn) return current;

        if (dragged.columnId === targetColumnId && !overTask) return current;

        const activeColumnTasks = current
          .filter((t) => t.columnId === dragged.columnId)
          .sort((a, b) => a.position - b.position);

        const targetColumnTasks = current
          .filter((t) => t.columnId === targetColumnId && t.id !== activeId)
          .sort((a, b) => a.position - b.position);

        if (dragged.columnId === targetColumnId) {
          // Reorder within a single column
          const oldIndex = activeColumnTasks.findIndex((t) => t.id === activeId);
          const newIndex = activeColumnTasks.findIndex((t) => t.id === overId);
          if (oldIndex === -1 || newIndex === -1) return current;

          const reordered = arrayMove(activeColumnTasks, oldIndex, newIndex);
          const updated = reordered.map((t, i) => ({ ...t, position: i }));

          return current.map((t) => {
            const u = updated.find((r) => r.id === t.id);
            return u ?? t;
          });
        } else {
          // Move to another column
          const overIndex = overTask
            ? targetColumnTasks.findIndex((t) => t.id === overId)
            : targetColumnTasks.length;

          const insertAt = overIndex === -1 ? targetColumnTasks.length : overIndex;

          targetColumnTasks.splice(insertAt, 0, {
            ...dragged,
            columnId: targetColumnId,
          });

          const updatedTarget = targetColumnTasks.map((t, i) => ({
            ...t,
            position: i,
          }));

          const updatedSource = activeColumnTasks
            .filter((t) => t.id !== activeId)
            .map((t, i) => ({ ...t, position: i }));

          const allUpdated = [...updatedTarget, ...updatedSource];

          return current.map((t) => {
            const u = allUpdated.find((r) => r.id === t.id);
            return u ?? t;
          });
        }
      });
    },
    [tasks, columns],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || !dragTasks) {
        setActiveTask(null);
        setDragTasks(null);
        setMovedTaskId(null);
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      const movedTask = dragTasks.find((t) => t.id === activeId);
      if (!movedTask) {
        setActiveTask(null);
        setDragTasks(null);
        setMovedTaskId(null);
        return;
      }

      const overTask = dragTasks.find((t) => t.id === overId);
      const targetColumnId = overTask ? overTask.columnId : overId;

      const isValidColumn = columns.some((c) => c.id === targetColumnId);
      if (!isValidColumn) {
        setActiveTask(null);
        setDragTasks(null);
        setMovedTaskId(null);
        return;
      }

      const columnTasks = dragTasks
        .filter((t) => t.columnId === targetColumnId)
        .sort((a, b) => a.position - b.position);

      const newPosition = columnTasks.findIndex((t) => t.id === activeId);

      const originalTask = tasks.find((t) => t.id === activeId);
      const positionChanged = newPosition !== originalTask?.position;
      const columnChanged = targetColumnId !== originalTask?.columnId;

      if (positionChanged || columnChanged) {
        onMoveTask(activeId, targetColumnId, newPosition >= 0 ? newPosition : 0);
        setMovedTaskId(activeId);
        // Do not reset dragTasks — wait for the server to respond
      } else {
        setDragTasks(null);
        setMovedTaskId(null);
      }

      setActiveTask(null);
    },
    [dragTasks, tasks, columns, onMoveTask],
  );

  function handleAddColumn(): void {
    const trimmed = newColumnTitle.trim();
    if (!trimmed) return;
    onAddColumn(trimmed);
    setNewColumnTitle('');
    setAddingColumn(false);
  }

  const columnIds = useMemo(
    () => sortedColumns.map((c) => c.id),
    [sortedColumns],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
        <div className='flex gap-4 items-start h-full overflow-x-auto pb-4'>
          {sortedColumns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={tasksByColumn.get(column.id) ?? []}
              onTaskClick={onTaskClick}
              onAddTask={onAddTask}
              onDeleteColumn={onDeleteColumn}
            />
          ))}

          <div className='w-72 shrink-0'>
            {addingColumn ? (
              <div className='bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-border)]'>
                <input
                  autoFocus
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddColumn();
                    if (e.key === 'Escape') {
                      setAddingColumn(false);
                      setNewColumnTitle('');
                    }
                  }}
                  placeholder='Column title...'
                  className='w-full text-sm text-[var(--color-text)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 outline-none focus:border-indigo-500 mb-2'
                />
                <div className='flex gap-1.5'>
                  <button
                    onClick={handleAddColumn}
                    className='text-xs bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-md hover:bg-[var(--color-primary-hover)] transition-colors'
                  >
                    Add column
                  </button>
                  <button
                    onClick={() => {
                      setAddingColumn(false);
                      setNewColumnTitle('');
                    }}
                    className='text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-2 py-1.5 transition-colors'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingColumn(true)}
                className='w-full text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] border border-dashed border-[var(--color-border)] rounded-xl py-3 transition-colors'
              >
                + Add column
              </button>
            )}
          </div>
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeTask && (
          <div className='rotate-2 opacity-95 shadow-xl'>
            <TaskCard task={activeTask} onClick={() => undefined} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};