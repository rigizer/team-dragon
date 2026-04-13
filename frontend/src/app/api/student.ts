import { API_ENDPOINTS } from "../config/api";
import { ApiError, requestJson, toMessage, toOptionalNumber, toOptionalString, toRecord } from "./http";

export interface StudentLoginResponse {
  isSuccess: boolean;
  user_id: string | null;
  name: string | null;
  role: string | null;
}

export interface StudentTrackSummary {
  id: string;
  name: string;
}

export interface StudentTrackListResult {
  tracks: StudentTrackSummary[];
  message: string | null;
}

interface StudentTrackItemResponse {
  track_id?: number | null;
  track_name?: string | null;
}

export interface UploadProjectPayload {
  studentId: string;
  trackId?: string | null;
  title: string;
  projectFiles: File[];
  projectLink?: string;
  extraLinks?: string[];
}

interface ProjectUploadResponse {
  project_id?: number | null;
  status?: string | null;
}

export interface UploadedProject {
  projectId: number;
  status: string | null;
}

interface ContributionActionItemResponse {
  action?: string;
}

interface ContributionResultItemResponse {
  result?: string;
}

interface ContributionSkillItemResponse {
  skill?: string;
}

interface ContributionSuggestionItemResponse {
  role?: string;
  actions?: ContributionActionItemResponse[];
  results?: ContributionResultItemResponse[];
  skills?: ContributionSkillItemResponse[];
  source?: string;
}

interface ContributionCandidateResponse {
  suggestions?: ContributionSuggestionItemResponse[];
}

export interface ContributionSuggestion {
  role: string;
  actions: string[];
  results: string[];
  skills: string[];
  source: string | null;
}

interface ContributionUpdateResponse {
  status?: string | null;
}

export interface ContributionUpdatePayload {
  suggestions: Array<{
    role: string;
    actions: string[];
    results: string[];
    skills: string[];
  }>;
}

function normalizeStringArray<T>(items: T[] | undefined, pick: (item: T) => unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => toOptionalString(pick(item)))
    .filter((value): value is string => Boolean(value));
}

export async function loginStudent(loginId: string): Promise<StudentLoginResponse> {
  const data = await requestJson<unknown>(
    API_ENDPOINTS.studentLogin,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login_id: loginId }),
    },
    "학생 로그인에 실패했습니다."
  );

  const record = toRecord(data);
  if (!record) {
    throw new ApiError(500, "학생 로그인 응답 형식이 올바르지 않습니다.", data);
  }

  return {
    isSuccess: Boolean(record.isSuccess),
    user_id: toOptionalString(record.user_id),
    name: toOptionalString(record.name),
    role: toOptionalString(record.role),
  };
}

export async function fetchStudentTracks(studentId: string): Promise<StudentTrackListResult> {
  const data = await requestJson<unknown>(
    API_ENDPOINTS.studentTracks(studentId),
    undefined,
    "수강생 트랙 목록 조회에 실패했습니다."
  );

  const record = toRecord(data);
  const tracks = Array.isArray(record?.tracks)
    ? (record?.tracks as StudentTrackItemResponse[])
        .map((track) => ({
          id: String(toOptionalNumber(track.track_id) ?? ""),
          name: toOptionalString(track.track_name) ?? "이름 없는 트랙",
        }))
        .filter((track) => track.id)
    : [];

  return {
    tracks,
    message: toMessage(data),
  };
}

export async function uploadProject(payload: UploadProjectPayload): Promise<UploadedProject> {
  const formData = new FormData();
  formData.append("student_id", payload.studentId);
  formData.append("title", payload.title);

  if (payload.trackId?.trim()) {
    formData.append("track_id", payload.trackId.trim());
  }

  if (payload.projectLink?.trim()) {
    formData.append("project_link", payload.projectLink.trim());
  }

  const extraLinks = (payload.extraLinks ?? []).map((link) => link.trim()).filter(Boolean);
  if (extraLinks.length > 0) {
    formData.append("extra_links", extraLinks.join(","));
  }

  payload.projectFiles.forEach((file) => {
    formData.append("project_pdf", file);
  });

  const data = await requestJson<ProjectUploadResponse>(
    API_ENDPOINTS.projects,
    {
      method: "POST",
      body: formData,
    },
    "프로젝트 업로드에 실패했습니다."
  );

  const projectId = toOptionalNumber(data.project_id);
  if (projectId === null) {
    throw new Error("프로젝트 업로드 응답에 project_id가 없습니다.");
  }

  return {
    projectId,
    status: toOptionalString(data.status),
  };
}

export async function fetchContributionCandidates(projectId: string | number): Promise<ContributionSuggestion[]> {
  const data = await requestJson<ContributionCandidateResponse>(
    API_ENDPOINTS.projectContributionCandidates(projectId),
    undefined,
    "기여도 후보 조회에 실패했습니다."
  );

  if (!Array.isArray(data.suggestions)) {
    return [];
  }

  return data.suggestions.map((suggestion) => ({
    role: toOptionalString(suggestion.role) ?? "역할 정보 없음",
    actions: normalizeStringArray(suggestion.actions, (item) => item.action),
    results: normalizeStringArray(suggestion.results, (item) => item.result),
    skills: normalizeStringArray(suggestion.skills, (item) => item.skill),
    source: toOptionalString(suggestion.source),
  }));
}

export async function updateProjectContributions(
  projectId: string | number,
  payload: ContributionUpdatePayload
): Promise<string | null> {
  const data = await requestJson<ContributionUpdateResponse>(
    API_ENDPOINTS.projectContributions(projectId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        suggestions: payload.suggestions.map((suggestion) => ({
          role: suggestion.role,
          actions: suggestion.actions.map((action) => ({ action })),
          results: suggestion.results.map((result) => ({ result })),
          skills: suggestion.skills.map((skill) => ({ skill })),
        })),
      }),
    },
    "기여 입력 저장에 실패했습니다."
  );

  return toOptionalString(data.status);
}
