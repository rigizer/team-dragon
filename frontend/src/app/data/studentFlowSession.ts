export interface StudentFlowProgress {
  trackId: string | null;
  projectId: string | null;
}

const STUDENT_FLOW_PROGRESS_KEY = "koreait.student.flow-progress";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStudentFlowProgress(): StudentFlowProgress {
  if (!canUseStorage()) {
    return { trackId: null, projectId: null };
  }

  try {
    const raw = window.localStorage.getItem(STUDENT_FLOW_PROGRESS_KEY);
    if (!raw) {
      return { trackId: null, projectId: null };
    }

    const parsed = JSON.parse(raw) as Partial<StudentFlowProgress>;
    return {
      trackId: typeof parsed.trackId === "string" && parsed.trackId.trim() ? parsed.trackId : null,
      projectId:
        typeof parsed.projectId === "string" && parsed.projectId.trim() ? parsed.projectId : null,
    };
  } catch {
    return { trackId: null, projectId: null };
  }
}

export function saveStudentFlowProgress(progress: Partial<StudentFlowProgress>) {
  if (!canUseStorage()) {
    return;
  }

  const current = getStudentFlowProgress();
  const next: StudentFlowProgress = {
    trackId: progress.trackId ?? current.trackId,
    projectId: progress.projectId ?? current.projectId,
  };

  window.localStorage.setItem(STUDENT_FLOW_PROGRESS_KEY, JSON.stringify(next));
}

export function clearStudentFlowProgress() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STUDENT_FLOW_PROGRESS_KEY);
}
