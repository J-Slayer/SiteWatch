/**
 * useProjects — React Query hooks for project data.
 */

import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';

export const projectKeys = {
  all: ['projects'] as const,
  accessible: () => [...projectKeys.all, 'accessible'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
};

/** Return all active projects the current user can submit reports to. */
export function useAccessibleProjects() {
  return useQuery({
    queryKey: projectKeys.accessible(),
    queryFn: () => projectService.getAccessibleProjects(),
    staleTime: 1000 * 60 * 10, // projects change infrequently
  });
}

/** Return a single project by ID. */
export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectService.getProject(projectId),
    enabled: !!projectId,
  });
}
