import { API_ENDPOINTS } from "../config/api";
import { requestJson, toMessage, toOptionalNumber, toOptionalString, toRecord } from "./http";

interface InstructorStudentRecord {
  student_name?: unknown;
  studentName?: unknown;
  student_id?: unknown;
  student_login_id?: unknown;
  studentId?: unknown;
  login_id?: unknown;
  loginId?: unknown;
  name?: unknown;
  id?: unknown;
  user_id?: unknown;
  userId?: unknown;
}

interface InstructorStudentsResponse {
  students?: unknown;
}

export interface StudentOption {
  id: string;
  name: string;
  loginId?: string;
}

export interface CreateInstructorTrackPayload {
  name: string;
  domainType: string;
  materialFile: File;
  rubricFile: File;
}

export interface InstructorTrackCreateResponse {
  track_id: number;
  status: string;
}

interface InstructorTrackItemResponse {
  track_name?: string | null;
  track_id?: number | null;
}

interface InstructorTrackListResponse {
  tracks?: InstructorTrackItemResponse[];
}

export interface InstructorTrackSummary {
  id: string;
  name: string;
}

interface CandidateItemResponse {
  title?: string | null;
  description?: string | null;
  priority?: number | null;
  source_refs?: string | null;
  flags?: string | null;
}

interface CandidateListResponse {
  candidates?: CandidateItemResponse[];
}

export interface CriteriaCandidate {
  title: string;
  description: string;
  priority: number | null;
  sourceRefs: string | null;
  flags: string | null;
}

interface ApprovedCriterionResponseItem {
  id?: number | null;
  title?: string | null;
  status?: string | null;
}

interface TrackStudentAddRequest {
  student_login_id?: string;
  student_id?: number;
}

interface TrackStudentAddResponse {
  track_id?: number | null;
  student_id?: number | null;
  student_login_id?: string | null;
  student_name?: string | null;
  status?: string | null;
  message?: string | null;
}

interface TrackStudentRemoveResponse {
  track_id?: number | null;
  student_id?: number | null;
  removed_score_count?: number | null;
  status?: string | null;
  message?: string | null;
}

interface TrackCriterionAddRequest {
  title: string;
  description?: string | null;
  priority?: number | null;
  score_scale?: number | null;
}

interface TrackCriterionAddResponse {
  criterion_id?: number | null;
  title?: string | null;
  status?: string | null;
  score_scale?: number | null;
  message?: string | null;
}

interface TrackCriterionRemoveResponse {
  criterion_id?: number | null;
  track_id?: number | null;
  removed_score_count?: number | null;
  status?: string | null;
  message?: string | null;
}

interface ApproveCriteriaResponse {
  approved_count?: number | null;
  criteria?: ApprovedCriterionResponseItem[];
}

interface EvaluationMatrixTrackResponse {
  track_id?: number | null;
  track_name?: string | null;
  domain_type?: string | null;
}

interface EvaluationMatrixCriterionResponse {
  id?: number | null;
  title?: string | null;
  description?: string | null;
  priority?: number | null;
  score_scale?: number | null;
  status?: string | null;
}

interface EvaluationMatrixStudentResponse {
  student_id?: number | null;
  student_name?: string | null;
  login_id?: string | null;
  student_login_id?: string | null;
  evaluation_status?: string | null;
}

interface EvaluationMatrixScoreResponse {
  student_id?: number | null;
  criterion_id?: number | null;
  score?: number | null;
  comment?: string | null;
  status?: string | null;
}

interface EvaluationMatrixResponse {
  track?: EvaluationMatrixTrackResponse;
  criteria?: EvaluationMatrixCriterionResponse[];
  students?: EvaluationMatrixStudentResponse[];
  scores?: EvaluationMatrixScoreResponse[];
}

export interface ApprovedCriterion {
  id: number;
  title: string;
  status: string;
}

export interface ApproveCriteriaResult {
  approvedCount: number;
  criteria: ApprovedCriterion[];
}

export interface EvaluationMatrixCriterion {
  id: string;
  title: string;
  description: string;
  priority: number | null;
  scoreScale: number;
  status: string;
}

export interface EvaluationMatrixStudent {
  id: string;
  name: string;
  loginId: string;
  evaluationStatus: string | null;
}

export interface EvaluationMatrixScore {
  studentId: string;
  criterionId: string;
  score: number | null;
  comment: string | null;
  status: string | null;
}

export interface EvaluationMatrix {
  track: {
    id: string;
    name: string;
    domainType: string;
  };
  criteria: EvaluationMatrixCriterion[];
  students: EvaluationMatrixStudent[];
  scores: EvaluationMatrixScore[];
}

export interface SaveTrackScoreInput {
  studentId: string | number;
  criterionId: string | number;
  score: number;
  comment?: string | null;
}

export interface TrackPortfolioItem {
  studentId: string;
  studentName: string;
  portfolioUrl: string | null;
  projectId: number | null;
}

export interface TrackPortfolioResult {
  portfolios: TrackPortfolioItem[];
  message: string | null;
}

function getErrorMessage(status: number, data: unknown) {
  return toMessage(data) ?? `요청 처리에 실패했습니다. (${status})`;
}

function normalizeIdentifier(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  return null;
}

function getInstructorStudents(data: InstructorStudentsResponse): unknown[] {
  const record = toRecord(data);
  if (!record) {
    if (Array.isArray(data)) {
      return data;
    }

    return [];
  }

  if (Array.isArray(record.students)) {
    return record.students;
  }

  if (Array.isArray(record.data)) {
    return record.data;
  }

  return [];
}

function toInstructorStudentOption(record: InstructorStudentRecord): StudentOption | null {
  const name =
    toOptionalString(record.student_name) ??
    toOptionalString(record.name) ??
    toOptionalString(record.studentName) ??
    null;

  const studentId =
    normalizeIdentifier(record.student_id) ??
    normalizeIdentifier(record.id) ??
    normalizeIdentifier(record.studentId) ??
    null;

  const loginId =
    normalizeIdentifier(record.student_login_id) ??
    normalizeIdentifier(record.login_id) ??
    normalizeIdentifier(record.loginId) ??
    normalizeIdentifier(record.user_id) ??
    normalizeIdentifier(record.userId) ??
    null;

  if (!name || (!studentId && !loginId)) {
    return null;
  }

  return {
    id: studentId ?? loginId ?? "",
    name,
    loginId: loginId ?? undefined,
  };
}

export async function fetchInstructorStudents(instructorId: string): Promise<StudentOption[]> {
  const data = await requestJson<InstructorStudentsResponse>(
    API_ENDPOINTS.instructorStudents(instructorId),
    undefined,
    "학생 목록 조회에 실패했습니다."
  );

  const rawStudents = getInstructorStudents(data);

  if (!Array.isArray(rawStudents)) {
    return [];
  }

  return rawStudents
    .map((student) => toInstructorStudentOption(toRecord(student) ?? {}))
    .filter((student): student is StudentOption => Boolean(student));
}

export async function fetchInstructorTracks(instructorId: string): Promise<InstructorTrackSummary[]> {
  const data = await requestJson<InstructorTrackListResponse>(
    API_ENDPOINTS.instructorTracks(instructorId),
    undefined,
    "트랙 목록 조회에 실패했습니다."
  );

  if (!Array.isArray(data.tracks)) {
    return [];
  }

  return data.tracks
    .map((track) => ({
      id: String(toOptionalNumber(track.track_id) ?? ""),
      name: toOptionalString(track.track_name) ?? "이름 없는 트랙",
    }))
    .filter((track) => track.id);
}

export async function createInstructorTrack(
  instructorId: string,
  payload: CreateInstructorTrackPayload
): Promise<InstructorTrackCreateResponse> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("domain_type", payload.domainType);
  formData.append("material_file", payload.materialFile);
  formData.append("rubric_file", payload.rubricFile);

  const response = await fetch(API_ENDPOINTS.instructorTracks(instructorId), {
    method: "POST",
    body: formData,
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, data));
  }

  const record = toRecord(data);
  const trackId = toOptionalNumber(record?.track_id);
  const status = toOptionalString(record?.status);

  if (trackId === null || !status) {
    throw new Error("트랙 생성 응답 형식이 올바르지 않습니다.");
  }

  return {
    track_id: trackId,
    status,
  };
}

export async function fetchCriteriaCandidates(trackId: string | number): Promise<CriteriaCandidate[]> {
  const data = await requestJson<CandidateListResponse>(
    API_ENDPOINTS.trackCriteriaCandidates(trackId),
    undefined,
    "평가지표 후보 조회에 실패했습니다."
  );

  if (!Array.isArray(data.candidates)) {
    return [];
  }

  return data.candidates.map((candidate, index) => ({
    title: toOptionalString(candidate.title) ?? `평가지표 ${index + 1}`,
    description: toOptionalString(candidate.description) ?? "",
    priority: toOptionalNumber(candidate.priority),
    sourceRefs: toOptionalString(candidate.source_refs),
    flags: toOptionalString(candidate.flags),
  }));
}

export async function approveCriteria(
  trackId: string | number,
  criterionIds?: number[]
): Promise<ApproveCriteriaResult> {
  const data = await requestJson<ApproveCriteriaResponse>(
    API_ENDPOINTS.trackCriteriaApprove(trackId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        criterionIds && criterionIds.length > 0 ? { criterion_ids: criterionIds } : {}
      ),
    },
    "평가지표 확정에 실패했습니다."
  );

  const approvedItems = Array.isArray(data.criteria)
    ? data.criteria
        .map((item) => {
          const id = toOptionalNumber(item.id);
          const title = toOptionalString(item.title);
          const status = toOptionalString(item.status);

          if (id === null || !title || !status) {
            return null;
          }

          return {
            id,
            title,
            status,
          } satisfies ApprovedCriterion;
        })
        .filter((item): item is ApprovedCriterion => Boolean(item))
    : [];

  return {
    approvedCount: toOptionalNumber(data.approved_count) ?? approvedItems.length,
    criteria: approvedItems,
  };
}

export async function saveTrackEvaluations(
  trackId: string | number,
  scores: SaveTrackScoreInput[]
): Promise<string | null> {
  const data = await requestJson<unknown>(
    API_ENDPOINTS.trackEvaluations(trackId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scores: scores.map((score) => ({
          student_id: Number(score.studentId),
          criterion_id: Number(score.criterionId),
          score: score.score,
          comment: score.comment ?? null,
        })),
      }),
    },
    "점수 저장에 실패했습니다."
  );

  return toMessage(data);
}

export async function addStudentToTrack(
  trackId: string | number,
  studentLoginId?: string,
  studentId?: string
): Promise<string> {
  const payload: TrackStudentAddRequest = {};
  const normalizedStudentLoginId = normalizeIdentifier(studentLoginId);
  const normalizedStudentId = studentId ? toOptionalNumber(studentId) : null;

  if (normalizedStudentLoginId) {
    payload.student_login_id = normalizedStudentLoginId;
  }

  if (normalizedStudentId !== null) {
    payload.student_id = normalizedStudentId;
  }

  if (!payload.student_login_id && payload.student_id === undefined) {
    throw new Error("학생 식별자를 입력해주세요.");
  }

  const data = await requestJson<TrackStudentAddResponse>(
    API_ENDPOINTS.trackAddStudent(trackId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "학생 추가에 실패했습니다."
  );

  return toMessage(data) ?? "학생이 추가되었습니다.";
}

export async function removeStudentFromTrack(
  trackId: string | number,
  studentId: string | number
): Promise<string> {
  const data = await requestJson<TrackStudentRemoveResponse>(
    API_ENDPOINTS.trackDeleteStudent(trackId, studentId),
    {
      method: "DELETE",
    },
    "학생 삭제에 실패했습니다."
  );

  return toMessage(data) ?? "학생을 삭제했습니다.";
}

export async function addCriterionToTrack(
  trackId: string | number,
  title: string,
  options?: {
    description?: string;
    priority?: number | null;
    scoreScale?: number | null;
  }
): Promise<string> {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    throw new Error("평가 요소 제목을 입력해주세요.");
  }

  const payload: TrackCriterionAddRequest = {
    title: normalizedTitle,
    description: options?.description?.trim() || null,
    priority: options?.priority ?? null,
    score_scale: options?.scoreScale ?? 5,
  };

  const data = await requestJson<TrackCriterionAddResponse>(
    API_ENDPOINTS.trackAddCriterion(trackId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "평가 요소 추가에 실패했습니다."
  );

  return toMessage(data) ?? "평가 요소가 추가되었습니다.";
}

export async function removeCriterionFromTrack(
  trackId: string | number,
  criterionId: string | number
): Promise<string> {
  const data = await requestJson<TrackCriterionRemoveResponse>(
    API_ENDPOINTS.trackDeleteCriterion(trackId, criterionId),
    {
      method: "DELETE",
    },
    "평가 요소 삭제에 실패했습니다."
  );

  return toMessage(data) ?? "평가 요소를 삭제했습니다.";
}

export async function fetchEvaluationMatrix(
  trackId: string | number
): Promise<EvaluationMatrix> {
  const data = await requestJson<EvaluationMatrixResponse>(
    API_ENDPOINTS.trackEvaluationMatrix(trackId),
    undefined,
    "평가표 조회에 실패했습니다."
  );

  const track = toRecord(data.track);
  const trackIdValue = toOptionalNumber(track?.track_id);
  const trackName = toOptionalString(track?.track_name);
  const domainType = toOptionalString(track?.domain_type) ?? "";

  if (trackIdValue === null || !trackName) {
    throw new Error("평가표 응답의 트랙 정보 형식이 올바르지 않습니다.");
  }

  const criteria = Array.isArray(data.criteria)
    ? data.criteria
        .map((criterion) => {
          const id = toOptionalNumber(criterion.id);
          const title = toOptionalString(criterion.title);

          if (id === null || !title) {
            return null;
          }

          return {
            id: String(id),
            title,
            description: toOptionalString(criterion.description) ?? "",
            priority: toOptionalNumber(criterion.priority),
            scoreScale: toOptionalNumber(criterion.score_scale) ?? 5,
            status: toOptionalString(criterion.status) ?? "approved",
          } satisfies EvaluationMatrixCriterion;
        })
        .filter((item): item is EvaluationMatrixCriterion => Boolean(item))
    : [];

  const students = Array.isArray(data.students)
    ? data.students
        .map((student) => {
          const studentId = toOptionalNumber(student.student_id);
          const studentName = toOptionalString(student.student_name);
          const loginId = toOptionalString(student.login_id) ?? toOptionalString(student.student_login_id);

          if (studentId === null || !studentName) {
            return null;
          }

          return {
            id: String(studentId),
            name: studentName,
            loginId: loginId ?? "",
            evaluationStatus: toOptionalString(student.evaluation_status),
          } satisfies EvaluationMatrixStudent;
        })
        .filter((item): item is EvaluationMatrixStudent => Boolean(item))
    : [];

  const scores = Array.isArray(data.scores)
    ? data.scores
        .map((score) => {
          const studentId = toOptionalNumber(score.student_id);
          const criterionId = toOptionalNumber(score.criterion_id);

          if (studentId === null || criterionId === null) {
            return null;
          }

          return {
            studentId: String(studentId),
            criterionId: String(criterionId),
            score: toOptionalNumber(score.score),
            comment: toOptionalString(score.comment),
            status: toOptionalString(score.status),
          } satisfies EvaluationMatrixScore;
        })
        .filter((item): item is EvaluationMatrixScore => Boolean(item))
    : [];

  return {
    track: {
      id: String(trackIdValue),
      name: trackName,
      domainType,
    },
    criteria,
    students,
    scores,
  };
}

export async function fetchTrackPortfolios(trackId: string | number): Promise<TrackPortfolioResult> {
  const data = await requestJson<unknown>(
    API_ENDPOINTS.trackPortfolio(trackId),
    undefined,
    "포트폴리오 목록 조회에 실패했습니다."
  );

  if (!Array.isArray(data)) {
    return {
      portfolios: [],
      message: toMessage(data),
    };
  }

  return {
    portfolios: data
      .map((item) => {
        const record = toRecord(item);
        const studentId = toOptionalNumber(record?.student_id);
        const studentName = toOptionalString(record?.student_name);
        const projectId = toOptionalNumber(record?.project_id);

        if (studentId === null || !studentName) {
          return null;
        }

        return {
          studentId: String(studentId),
          studentName,
          portfolioUrl: toOptionalString(record?.portfolio_url),
          projectId,
        } satisfies TrackPortfolioItem;
      })
      .filter((item): item is TrackPortfolioItem => Boolean(item)),
    message: null,
  };
}
