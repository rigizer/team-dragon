import { fetchEmploymentPack } from "../api/portfolio";

export type EmploymentPackStatus = "pending" | "ready" | "denied" | "provisional";

export interface EmploymentPackState {
  status: EmploymentPackStatus;
  fileUrl: string | null;
  blockingReason: string | null;
  previewBlockingReason: string | null;
  trackId: string | null;
  trackName: string | null;
  source: "api" | "local";
}

export interface LocalStudentTrackFallback {
  id: string;
  name: string;
  badgeText: string;
  blockingReason: string;
  actionLabel: string;
  statusPath: string;
}

const LOCAL_PACK_STATE_KEY = "koreait.student.pack-state";
const LOCAL_STATUS_KEY = "studentStatus";
const LOCAL_BLOCKING_REASON_KEY = "studentBlockingReason";
const LOCAL_TRACK_ID_KEY = "studentTrackId";
const LOCAL_TRACK_NAME_KEY = "studentTrackName";

type AppImportMetaEnv = {
  DEV?: boolean;
};

const APP_ENV = (import.meta as ImportMeta & { env?: AppImportMetaEnv }).env ?? {};
const LOCAL_DEMO_STUDENT_IDS = new Set(["0002"]);

const LOCAL_BLOCKING_REASON_DETAIL =
  "개인 기여 설명과 배포 링크가 누락되어 패킷 생성이 보류되었습니다.";

const LOCAL_PROVISIONAL_TRACK: LocalStudentTrackFallback = {
  id: "t4",
  name: "AI 서비스 설계",
  badgeText: "잠정 상태",
  blockingReason: `누락/차단 사유: ${LOCAL_BLOCKING_REASON_DETAIL}`,
  actionLabel: "누락 사유 확인",
  statusPath: "/student/track/t4/status",
};

const PREVIEW_BLOCKING_REASON = "개인 기여 설명과 배포 링크가 누락되었습니다.";

interface StoredStudentPackState {
  status?: EmploymentPackStatus | null;
  blockingReason?: string | null;
  previewBlockingReason?: string | null;
  trackId?: string | null;
  trackName?: string | null;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorageValue(key: string) {
  if (!canUseStorage()) {
    return null;
  }

  const value = window.localStorage.getItem(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readStoredPackState(): StoredStudentPackState | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_PACK_STATE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredStudentPackState;
    return {
      status: parsed.status ?? null,
      blockingReason: normalizeText(parsed.blockingReason),
      previewBlockingReason: normalizeText(parsed.previewBlockingReason),
      trackId: normalizeText(parsed.trackId),
      trackName: normalizeText(parsed.trackName),
    };
  } catch {
    return null;
  }
}

function writeStoredPackState(state: StoredStudentPackState) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(LOCAL_PACK_STATE_KEY, JSON.stringify(state));
}

function isDevDemoStudentSessionActive() {
  if (!APP_ENV.DEV) {
    return false;
  }

  const studentId = getStudentSessionStudentId();
  return studentId ? LOCAL_DEMO_STUDENT_IDS.has(studentId) : false;
}

function getMergedLocalPackState(): StoredStudentPackState | null {
  const stored = readStoredPackState();
  const explicitStatus = readStorageValue(LOCAL_STATUS_KEY) ?? stored?.status ?? null;
  const status = explicitStatus ?? (isDevDemoStudentSessionActive() ? "provisional" : null);
  const blockingReason = readStorageValue(LOCAL_BLOCKING_REASON_KEY) ?? stored?.blockingReason ?? null;
  const trackId = readStorageValue(LOCAL_TRACK_ID_KEY) ?? stored?.trackId ?? LOCAL_PROVISIONAL_TRACK.id;
  const trackName = readStorageValue(LOCAL_TRACK_NAME_KEY) ?? stored?.trackName ?? LOCAL_PROVISIONAL_TRACK.name;
  const previewBlockingReason = stored?.previewBlockingReason ?? PREVIEW_BLOCKING_REASON;

  if (status !== "provisional") {
    return null;
  }

  return {
    status,
    blockingReason: blockingReason ?? LOCAL_BLOCKING_REASON_DETAIL,
    previewBlockingReason,
    trackId,
    trackName,
  };
}

export function getStudentSessionStudentId() {
  return readStorageValue("userId") ?? readStorageValue("studentId");
}

export function isLocalStudentPackFallbackActive() {
  return Boolean(getMergedLocalPackState());
}

export function activateLocalProvisionalStudentPack() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(LOCAL_STATUS_KEY, "provisional");
  window.localStorage.setItem(LOCAL_BLOCKING_REASON_KEY, LOCAL_BLOCKING_REASON_DETAIL);
  window.localStorage.setItem(LOCAL_TRACK_ID_KEY, LOCAL_PROVISIONAL_TRACK.id);
  window.localStorage.setItem(LOCAL_TRACK_NAME_KEY, LOCAL_PROVISIONAL_TRACK.name);
  writeStoredPackState({
    status: "provisional",
    blockingReason: LOCAL_BLOCKING_REASON_DETAIL,
    previewBlockingReason: PREVIEW_BLOCKING_REASON,
    trackId: LOCAL_PROVISIONAL_TRACK.id,
    trackName: LOCAL_PROVISIONAL_TRACK.name,
  });
}

export function getLocalStudentTrackFallbacks(): LocalStudentTrackFallback[] {
  return isLocalStudentPackFallbackActive() ? [LOCAL_PROVISIONAL_TRACK] : [];
}

export function getLocalEmploymentPackState(params?: { trackId?: string | null }): EmploymentPackState | null {
  const localState = getMergedLocalPackState();
  if (!localState) {
    return null;
  }

  if (params?.trackId && localState.trackId && params.trackId !== localState.trackId) {
    return null;
  }

  return {
    status: "provisional",
    fileUrl: null,
    blockingReason: localState.blockingReason ?? LOCAL_BLOCKING_REASON_DETAIL,
    previewBlockingReason: localState.previewBlockingReason ?? PREVIEW_BLOCKING_REASON,
    trackId: localState.trackId ?? LOCAL_PROVISIONAL_TRACK.id,
    trackName: localState.trackName ?? LOCAL_PROVISIONAL_TRACK.name,
    source: "local",
  };
}

export function buildPackStateFromApiResponse(
  fileUrl: string | null,
  backendStatus: string | null,
  trackId: string | null
): EmploymentPackState {
  if (backendStatus === "denied") {
    return {
      status: "denied",
      fileUrl: null,
      blockingReason: null,
      previewBlockingReason: null,
      trackId,
      trackName: null,
      source: "api",
    };
  }

  if (backendStatus === "provisional") {
    return {
      status: "provisional",
      fileUrl,
      blockingReason: null,
      previewBlockingReason: null,
      trackId,
      trackName: null,
      source: "api",
    };
  }

  if (backendStatus === "approved" || backendStatus === "certified" || fileUrl) {
    return {
      status: "ready",
      fileUrl,
      blockingReason: null,
      previewBlockingReason: null,
      trackId,
      trackName: null,
      source: "api",
    };
  }

  return {
    status: "pending",
    fileUrl: null,
    blockingReason: null,
    previewBlockingReason: null,
    trackId,
    trackName: null,
    source: "api",
  };
}

export async function loadEmploymentPackState(params: {
  projectId?: string | number | null;
  trackId?: string | null;
}): Promise<EmploymentPackState | null> {
  if (params.projectId) {
    try {
      const response = await fetchEmploymentPack(params.projectId);
      return buildPackStateFromApiResponse(
        response.fileUrl,
        response.status,
        normalizeText(params.trackId)
      );
    } catch {
      // keep the local demo state as a safety net when the API call fails
    }
  }

  return getLocalEmploymentPackState({ trackId: params.trackId ?? null });
}
