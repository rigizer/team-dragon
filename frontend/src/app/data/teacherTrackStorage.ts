export interface TeacherCriterion {
  id: string;
  name: string;
  description: string;
}

export interface TeacherTrackStudent {
  id: string;
  name: string;
  hasSubmitted: boolean;
  isApproved: boolean;
}

export interface TeacherTrackScore {
  criterionId: string;
  studentId: string;
  value: string;
}

export interface TeacherTrackRecord {
  id: string;
  name: string;
  description: string;
  assignmentDesc: string;
  files: string[];
  createdAt: string;
  criteria: TeacherCriterion[];
  students: TeacherTrackStudent[];
  scores: TeacherTrackScore[];
  criteriaConfirmed?: boolean;
  hiddenCriterionIds?: string[];
  hiddenStudentIds?: string[];
}

export interface TeacherTrackSummary {
  id: string;
  name: string;
  description: string;
  studentCount: number;
  pendingReviews: number;
  createdAt: string;
}

export interface LegacyTeacherCriteriaDraft {
  trackId: string;
  courseName: string;
  assignmentDesc: string;
  files: string[];
  criteria: TeacherCriterion[];
  students: Array<Pick<TeacherTrackStudent, "id" | "name">>;
  scores: TeacherTrackScore[];
}

const TRACK_STORAGE_KEY = "koreait.teacher.track-records";
const LEGACY_CRITERIA_DRAFT_KEY = "koreait.teacher.legacy-criteria-draft";

const DEFAULT_TRACK_SUMMARIES: TeacherTrackSummary[] = [
  {
    id: "t1",
    name: "백엔드 개발 기초",
    description: "Spring Boot와 JPA를 활용한 RESTful API 개발",
    studentCount: 15,
    pendingReviews: 3,
    createdAt: "2026-03-15",
  },
  {
    id: "t2",
    name: "프론트엔드 심화",
    description: "React와 TypeScript를 활용한 SPA 개발",
    studentCount: 12,
    pendingReviews: 0,
    createdAt: "2026-03-10",
  },
];

export const DEFAULT_TRACK_CRITERIA: TeacherCriterion[] = [
  {
    id: "c1",
    name: "요구사항 구조화",
    description: "문제 정의, 범위, 예외 상황을 텍스트로 명확히 정리",
  },
  {
    id: "c2",
    name: "API 및 데이터 설계",
    description: "엔드포인트/요청/응답과 데이터 모델을 일관성 있게 연결",
  },
  {
    id: "c3",
    name: "구현 근거와 검증 가능성",
    description: "코드·링크·결과·테스트를 연결해 검증 가능한 설명",
  },
  {
    id: "c4",
    name: "협업과 역할 명확화",
    description: "팀 결과와 개인 기여를 구분해 역할과 책임을 서술",
  },
];

export const DEFAULT_LEGACY_CRITERIA: TeacherCriterion[] = [
  {
    id: "c1",
    name: "코드 구조",
    description: "코드의 구조화 및 모듈화 수준",
  },
  {
    id: "c2",
    name: "알고리즘 이해도",
    description: "문제 해결을 위한 알고리즘 적용 능력",
  },
  {
    id: "c3",
    name: "문서화",
    description: "코드 주석 및 README 작성 수준",
  },
  {
    id: "c4",
    name: "테스트 커버리지",
    description: "단위 테스트 및 통합 테스트 완성도",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorage<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function toSummary(record: TeacherTrackRecord): TeacherTrackSummary {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    studentCount: record.students.length,
    pendingReviews: record.students.filter(
      (student) => student.hasSubmitted && !student.isApproved
    ).length,
    createdAt: record.createdAt,
  };
}

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function generateTeacherTrackId() {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function getTeacherTrackRecords() {
  return readStorage<TeacherTrackRecord[]>(TRACK_STORAGE_KEY, []);
}

export function getTeacherTrackRecord(trackId: string) {
  return getTeacherTrackRecords().find((track) => track.id === trackId) ?? null;
}

export function getTeacherTrackSummaries() {
  const mergedTracks = new Map<string, TeacherTrackSummary>(
    DEFAULT_TRACK_SUMMARIES.map((track) => [track.id, track])
  );

  getTeacherTrackRecords().forEach((track) => {
    mergedTracks.set(track.id, toSummary(track));
  });

  return Array.from(mergedTracks.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt)
  );
}

export function getTeacherTrackSummary(trackId: string) {
  return getTeacherTrackSummaries().find((track) => track.id === trackId) ?? null;
}

export function upsertTeacherTrackRecord(track: TeacherTrackRecord) {
  const records = getTeacherTrackRecords();
  const nextRecords = records.filter((record) => record.id !== track.id);

  nextRecords.unshift(track);
  writeStorage(TRACK_STORAGE_KEY, nextRecords);
}

export function getLegacyTeacherCriteriaDraft() {
  return readStorage<LegacyTeacherCriteriaDraft | null>(LEGACY_CRITERIA_DRAFT_KEY, null);
}

export function saveLegacyTeacherCriteriaDraft(draft: LegacyTeacherCriteriaDraft) {
  writeStorage(LEGACY_CRITERIA_DRAFT_KEY, draft);
}
