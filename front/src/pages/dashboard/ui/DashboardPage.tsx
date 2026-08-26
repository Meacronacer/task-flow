import { useState } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import { useProjects } from '@entities/project/api';
import { ProjectCard } from '@entities/project/ui';
import { CreateProjectModal } from '@features/create-project';
import { Header } from '@widgets/header';
import { Button, Spinner } from '@shared/ui';

export function DashboardPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: projects, isLoading, isError } = useProjects();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              Projects
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {projects?.length
                ? `${projects.length} project${projects.length === 1 ? '' : 's'}`
                : 'No projects yet'}
            </p>
          </div>

          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus size={16} />
            New project
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-400">
            Failed to load projects. Please refresh the page.
          </div>
        ) : projects?.length === 0 ? (
          <EmptyState onCreateClick={() => setIsCreateOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>

      <CreateProjectModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
        <FolderKanban size={24} className="text-indigo-400" />
      </div>
      <h3 className="mb-1 font-semibold text-[var(--color-text)]">
        No projects yet
      </h3>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        Create your first project to get started
      </p>
      <Button onClick={onCreateClick} className="gap-2">
        <Plus size={16} />
        Create project
      </Button>
    </div>
  );
}