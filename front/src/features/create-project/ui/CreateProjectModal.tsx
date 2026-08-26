import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateProject } from '@entities/project/api';
import { Button, Input, Modal } from '@shared/ui';

const schema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: FormValues) => {
    createProject.mutate(
      { name: values.name, description: values.description },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create project">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Project name"
          placeholder="My awesome project"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-text-muted)]">
            Description
            <span className="ml-1 text-xs font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="What is this project about?"
            rows={3}
            className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            {...register('description')}
          />
          {errors.description ? (
            <span className="text-xs text-red-400">
              {errors.description.message}
            </span>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createProject.isPending}>
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  );
}