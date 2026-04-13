type AppImportMetaEnv = {
  DEV?: boolean;
  VITE_API_BASE_URL?: string;
  VITE_API_PROXY_TARGET?: string;
};

const APP_ENV = (import.meta as ImportMeta & { env?: AppImportMetaEnv }).env ?? {};
const API_BASE = (APP_ENV.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
const DEV_BACKEND_ORIGIN =
  API_BASE || APP_ENV.VITE_API_PROXY_TARGET ? "" : "http://localhost:8000";

function buildApiUrl(path: string, options?: { devDirectOrigin?: string }): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const directOrigin =
    API_BASE || (APP_ENV.DEV ? options?.devDirectOrigin?.trim().replace(/\/+$/, '') ?? '' : '');

  if (directOrigin.endsWith('/api') && normalizedPath.startsWith('/api')) {
    return `${directOrigin}${normalizedPath.slice(4) || ''}`;
  }

  return `${directOrigin}${normalizedPath}`;
}

function buildBackendApiUrl(path: string): string {
  return buildApiUrl(path, { devDirectOrigin: DEV_BACKEND_ORIGIN });
}

export const API_ENDPOINTS = {
  login: buildApiUrl('/api/auth/login'),
  studentLogin: buildApiUrl('/api/auth/login'),
  instructorStudents: (instructorId: string) =>
    buildBackendApiUrl(`/api/instructor/${encodeURIComponent(instructorId)}/students`),
  instructorTracks: (instructorId: string) =>
    buildBackendApiUrl(`/api/instructor/${encodeURIComponent(instructorId)}/tracks`),
  studentTracks: (studentId: string) =>
    buildBackendApiUrl(`/api/${encodeURIComponent(studentId)}/tracks`),
  trackCriteriaCandidates: (trackId: string | number) =>
    buildBackendApiUrl(`/api/tracks/${encodeURIComponent(String(trackId))}/criteria/candidates`),
  trackCriteriaApprove: (trackId: string | number) =>
    buildBackendApiUrl(`/api/tracks/${encodeURIComponent(String(trackId))}/criteria/approve`),
  trackAddStudent: (trackId: string | number) =>
    buildBackendApiUrl(`/api/tracks/${encodeURIComponent(String(trackId))}/students`),
  trackDeleteStudent: (trackId: string | number, studentId: string | number) =>
    buildBackendApiUrl(
      `/api/tracks/${encodeURIComponent(String(trackId))}/students/${encodeURIComponent(String(studentId))}`
    ),
  trackAddCriterion: (trackId: string | number) =>
    buildBackendApiUrl(`/api/tracks/${encodeURIComponent(String(trackId))}/criteria`),
  trackDeleteCriterion: (trackId: string | number, criterionId: string | number) =>
    buildBackendApiUrl(
      `/api/tracks/${encodeURIComponent(String(trackId))}/criteria/${encodeURIComponent(String(criterionId))}`
    ),
  trackPortfolio: (trackId: string | number) =>
    buildBackendApiUrl(`/api/tracks/${encodeURIComponent(String(trackId))}/portfolio`),
  trackEvaluationMatrix: (trackId: string | number) =>
    buildBackendApiUrl(`/api/tracks/${encodeURIComponent(String(trackId))}/evaluations`),
  trackEvaluations: (trackId: string | number) =>
    buildBackendApiUrl(`/api/projects/${encodeURIComponent(String(trackId))}/evaluations`),
  projects: buildBackendApiUrl('/api/projects'),
  projectContributionCandidates: (projectId: string | number) =>
    buildBackendApiUrl(`/api/projects/${encodeURIComponent(String(projectId))}/contributions/candidates`),
  projectContributions: (projectId: string | number) =>
    buildBackendApiUrl(`/api/projects/${encodeURIComponent(String(projectId))}/contributions`),
  projectReview: (projectId: string | number) =>
    buildBackendApiUrl(`/api/projects/${encodeURIComponent(String(projectId))}/review`),
  projectApprove: (projectId: string | number) =>
    buildBackendApiUrl(`/api/projects/${encodeURIComponent(String(projectId))}/approve`),
  projectEmploymentPack: (projectId: string | number) =>
    buildBackendApiUrl(`/api/projects/${encodeURIComponent(String(projectId))}/employment-pack`),
} as const;
