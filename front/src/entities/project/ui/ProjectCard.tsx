import { useNavigate } from 'react-router-dom';
import { Users, Calendar, ArrowRight } from 'lucide-react';
import { formatDate } from '@shared/lib';
import { Badge } from '@shared/ui';
import type { Project } from '../model';

interface ProjectCardProps {
  project: Project;
}

const roleVariant: Record<string, 'primary' | 'warning' | 'default'> = {
  owner: 'primary',
  admin: 'warning',
  member: 'default',
};

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}/board`)}
      className="group cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-200 hover:border-indigo-500/50 hover:bg-[var(--color-surface-2)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="truncate font-semibold text-[var(--color-text)] group-hover:text-indigo-400 transition-colors">
            {project.name}
          </h3>
          {project.description ? (
            <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]">
              {project.description}
            </p>
          ) : null}
        </div>
        <ArrowRight
          size={16}
          className="mt-0.5 shrink-0 text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {project.memberCount}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(project.createdAt)}
          </span>
        </div>
        <Badge variant={roleVariant[project.role] ?? 'default'}>
          {project.role}
        </Badge>
      </div>
    </div>
  );
}