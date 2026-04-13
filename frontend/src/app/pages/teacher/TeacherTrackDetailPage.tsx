import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  addCriterionToTrack,
  addStudentToTrack,
  approveCriteria,
  fetchEvaluationMatrix,
  fetchCriteriaCandidates,
  fetchInstructorStudents,
  fetchInstructorTracks,
  removeCriterionFromTrack,
  removeStudentFromTrack,
  saveTrackEvaluations,
  type CriteriaCandidate,
  type EvaluationMatrix,
  type StudentOption,
} from "../../api/instructor";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../components/ui/hover-card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../components/ui/command";
import { Textarea } from "../../components/ui/textarea";
import { cn } from "../../components/ui/utils";
import {
  ArrowLeft,
  FileCheck,
  Loader2,
  Check,
  ChevronsUpDown,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTeacherTrackRecord,
  type TeacherCriterion,
  type TeacherTrackRecord,
  upsertTeacherTrackRecord,
} from "../../data/teacherTrackStorage";

interface EditableCriteria extends CriteriaCandidate {
  key: string;
}

interface DeleteTarget {
  type: "student" | "criterion";
  id: string;
  name: string;
}

function createEditableCriteria(candidate?: CriteriaCandidate, suffix = Date.now().toString()) {
  return {
    key: `${suffix}-${Math.random().toString(36).slice(2, 8)}`,
    title: candidate?.title ?? "",
    description: candidate?.description ?? "",
    priority: candidate?.priority ?? null,
    sourceRefs: candidate?.sourceRefs ?? null,
    flags: candidate?.flags ?? null,
  } satisfies EditableCriteria;
}

function getLocalScoreValue(
  record: TeacherTrackRecord,
  criterionId: string,
  studentId: string
): string {
  return (
    record.scores.find(
      (score) => score.criterionId === criterionId && score.studentId === studentId
    )?.value ?? "-"
  );
}

function createLocalTrackFromMatrix(
  matrix: EvaluationMatrix,
  existingTrack?: TeacherTrackRecord | null
): TeacherTrackRecord {
  const students = matrix.students.map((student) => ({
    id: student.id,
    name: student.name,
    hasSubmitted: true,
    isApproved: student.evaluationStatus === "승인완료",
  }));

  return {
    id: matrix.track.id,
    name: matrix.track.name,
    description: matrix.track.domainType,
    assignmentDesc: matrix.track.domainType,
    files: [],
    createdAt: existingTrack?.createdAt ?? new Date().toISOString().slice(0, 10),
    criteria: matrix.criteria.map((criterion) => ({
      id: criterion.id,
      name: criterion.title,
      description: criterion.description,
    })),
    students,
    scores: matrix.scores.map((score) => ({
      criterionId: score.criterionId,
      studentId: score.studentId,
      value: score.score === null ? "-" : String(score.score),
    })),
    criteriaConfirmed: true,
    hiddenCriterionIds: [],
    hiddenStudentIds: [],
  };
}

export function TeacherTrackDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { trackId } = useParams();
  const locationState =
    (location.state as
      | {
          trackName?: string;
          trackDescription?: string;
          isNew?: boolean;
        }
      | null) ?? null;

  const [trackName, setTrackName] = useState(locationState?.trackName ?? "");
  const [trackDescription, setTrackDescription] = useState(locationState?.trackDescription ?? "");
  const [criteria, setCriteria] = useState<EditableCriteria[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [evaluationMessage, setEvaluationMessage] = useState<string | null>(null);
  const [isMutatingMatrix, setIsMutatingMatrix] = useState(false);
  const [isLocalFallback, setIsLocalFallback] = useState(false);
  const [isMatrixBacked, setIsMatrixBacked] = useState(false);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [isAddingMatrixStudent, setIsAddingMatrixStudent] = useState(false);
  const [openMatrixStudentCombobox, setOpenMatrixStudentCombobox] = useState(false);
  const [isAddingMatrixCriterion, setIsAddingMatrixCriterion] = useState(false);
  const [newMatrixCriterionName, setNewMatrixCriterionName] = useState("");
  const [localTrack, setLocalTrack] = useState<TeacherTrackRecord | null>(() =>
    trackId ? getTeacherTrackRecord(trackId) : null
  );
  const [newLocalCriterionName, setNewLocalCriterionName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  useEffect(() => {
    if (!trackId) {
      setLocalTrack(null);
      return;
    }

    setLocalTrack(getTeacherTrackRecord(trackId));
  }, [trackId]);

  useEffect(() => {
    let isMounted = true;

    const loadPage = async () => {
      if (!trackId) {
        if (!isMounted) return;
        setErrorMessage("트랙 정보를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      const storedLocalTrack = getTeacherTrackRecord(trackId);
      if (isMounted) {
        setLocalTrack(storedLocalTrack);
      }

      const useLocalFallback = () => {
        if (!storedLocalTrack || !isMounted) {
          return false;
        }

        setTrackName(storedLocalTrack.name);
        setTrackDescription(storedLocalTrack.description);
        setLocalTrack(storedLocalTrack);
        setIsLocalFallback(true);
        setIsMatrixBacked(false);
        setErrorMessage(null);
        setIsLoading(false);
        return true;
      };

      const instructorId = localStorage.getItem("userId")?.trim();
      if (!instructorId) {
        if (useLocalFallback()) {
          return;
        }

        if (!isMounted) return;
        setErrorMessage("로그인한 강사 정보를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      try {
        const [tracksResult, matrixResult, studentsResult] = await Promise.allSettled([
          fetchInstructorTracks(instructorId),
          fetchEvaluationMatrix(trackId),
          fetchInstructorStudents(instructorId),
        ]);

          if (!isMounted) return;

          const tracks =
            tracksResult.status === "fulfilled" ? tracksResult.value : [];
          const matrix =
            matrixResult.status === "fulfilled" ? matrixResult.value : null;
          const fetchedStudents =
            studentsResult.status === "fulfilled" ? studentsResult.value : [];
          const matrixSourceStudents =
            matrix?.students.map((student) => ({
              id: student.id,
              name: student.name,
              loginId: student.loginId,
            })) ?? [];

          const matchedTrack = tracks.find((track) => track.id === trackId);

          if (studentsResult.status === "rejected") {
            console.warn("학생 목록 조회에 실패했습니다.", studentsResult.reason);
            toast.warning("학생 목록 조회가 일부 실패해 수강생 목록이 비어 있을 수 있습니다.");
          }

          if (matrix && matrix.criteria.length > 0) {
            const nextLocalTrack = createLocalTrackFromMatrix(matrix, storedLocalTrack);
            setTrackName(matrix.track.name);
            setTrackDescription(matrix.track.domainType);
            setLocalTrack(nextLocalTrack);
            setStudents(fetchedStudents.length > 0 ? fetchedStudents : matrixSourceStudents);
            setIsLocalFallback(false);
            setIsMatrixBacked(true);
            setApprovalStatus("approved");
            setEvaluationMessage(null);
            setErrorMessage(null);
            upsertTeacherTrackRecord(nextLocalTrack);
            return;
          }

          const candidates = await fetchCriteriaCandidates(trackId);

          if (!isMounted) return;

          const nextCriteria = candidates.map((candidate, index) =>
            createEditableCriteria(candidate, String(index))
          );

          if (storedLocalTrack && (!matchedTrack || nextCriteria.length === 0)) {
            useLocalFallback();
            return;
          }

          setIsLocalFallback(false);
          setIsMatrixBacked(false);
          if (matchedTrack) {
            setTrackName(matchedTrack.name);
          }

          setCriteria(nextCriteria);
          setStudents(fetchedStudents);
          setErrorMessage(null);

          if (tracksResult.status === "rejected" && matrixResult.status === "rejected") {
            if (studentsResult.status === "rejected") {
              throw tracksResult.reason;
            }

            if (!matchedTrack) {
              toast.warning("트랙 목록 조회 실패로 이름을 표시하지 못했습니다.");
            }
          }
        } catch (error) {
          if (!isMounted) return;

          if (useLocalFallback()) {
            return;
          }

        setErrorMessage(
          error instanceof Error ? error.message : "트랙 상세 정보를 불러오지 못했습니다."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [trackId]);

  const canApprove = useMemo(
    () => criteria.length >= 3 && criteria.length <= 5 && criteria.every((item) => item.title.trim()),
    [criteria]
  );

  const matrixAddableStudents = useMemo(() => {
    if (!localTrack) {
      return students;
    }

    const currentStudentIds = new Set(localTrack.students.map((student) => student.id));
    return students.filter((student) => !currentStudentIds.has(student.id));
  }, [localTrack, students]);

  const localCriteriaConfirmed = Boolean(localTrack?.criteriaConfirmed);

  const persistLocalTrack = (updater: (current: TeacherTrackRecord) => TeacherTrackRecord) => {
    setLocalTrack((current) => {
      if (!current) {
        return current;
      }

      const nextTrack = updater(current);
      upsertTeacherTrackRecord(nextTrack);
      return nextTrack;
    });
  };

  const refreshMatrixState = async () => {
    if (!trackId) {
      throw new Error("트랙 정보를 찾을 수 없습니다.");
    }

    const matrix = await fetchEvaluationMatrix(trackId);
    const nextLocalTrack = createLocalTrackFromMatrix(matrix, getTeacherTrackRecord(trackId));

    setTrackName(matrix.track.name);
    setTrackDescription(matrix.track.domainType);
    setLocalTrack(nextLocalTrack);
    setIsLocalFallback(false);
    setIsMatrixBacked(true);
    setErrorMessage(null);
    upsertTeacherTrackRecord(nextLocalTrack);

    return nextLocalTrack;
  };

  const handleLocalCriteriaToggle = () => {
    if (!localTrack || isMatrixBacked) {
      return;
    }

    const nextConfirmed = !localCriteriaConfirmed;
    persistLocalTrack((current) => ({
      ...current,
      criteriaConfirmed: nextConfirmed,
    }));
    toast.success(nextConfirmed ? "평가 기준을 확정했습니다." : "기준 수정 모드로 전환했습니다.");
  };

  const handleLocalScoreChange = (criterionId: string, studentId: string, value: string) => {
    persistLocalTrack((current) => {
      const existingScore = current.scores.find(
        (score) => score.criterionId === criterionId && score.studentId === studentId
      );
      const nextScores = existingScore
        ? current.scores.map((score) =>
            score.criterionId === criterionId && score.studentId === studentId
              ? { ...score, value }
              : score
          )
        : [...current.scores, { criterionId, studentId, value }];

      return {
        ...current,
        scores: nextScores,
      };
    });
  };

  const handleLocalRemoveCriteria = (criterionId: string) => {
    if (!localTrack || isMatrixBacked || localCriteriaConfirmed) {
      return;
    }

    persistLocalTrack((current) => ({
      ...current,
      criteria: current.criteria.filter((criterion) => criterion.id !== criterionId),
      scores: current.scores.filter((score) => score.criterionId !== criterionId),
      hiddenCriterionIds: current.hiddenCriterionIds,
    }));
    toast.success("평가 요소를 삭제했습니다.");
  };

  const handleLocalRemoveStudent = (studentId: string) => {
    if (!localTrack || isMatrixBacked) {
      return;
    }

    persistLocalTrack((current) => ({
      ...current,
      students: current.students.filter((student) => student.id !== studentId),
      scores: current.scores.filter((score) => score.studentId !== studentId),
      hiddenStudentIds: current.hiddenStudentIds,
    }));
    toast.success("학생을 삭제했습니다.");
  };

  const handleRemoveCriterion = async (criterionId: string) => {
    if (!localTrack) {
      return;
    }

    if (!isMatrixBacked) {
      handleLocalRemoveCriteria(criterionId);
      return;
    }

    if (!trackId) {
      toast.error("트랙 정보를 찾을 수 없습니다.");
      return;
    }

    setIsMutatingMatrix(true);
    try {
      const message = await removeCriterionFromTrack(trackId, criterionId);
      await refreshMatrixState();
      setEvaluationMessage(message);
      toast.success("평가 요소를 삭제하고 평가표를 갱신했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "평가 요소 삭제에 실패했습니다.");
    } finally {
      setIsMutatingMatrix(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!localTrack) {
      return;
    }

    if (!isMatrixBacked) {
      handleLocalRemoveStudent(studentId);
      return;
    }

    if (!trackId) {
      toast.error("트랙 정보를 찾을 수 없습니다.");
      return;
    }

    setIsMutatingMatrix(true);
    try {
      const message = await removeStudentFromTrack(trackId, studentId);
      await refreshMatrixState();
      setEvaluationMessage(message);
      toast.success("학생을 삭제하고 평가표를 갱신했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "학생 삭제에 실패했습니다.");
    } finally {
      setIsMutatingMatrix(false);
    }
  };

  const requestDelete = (target: DeleteTarget) => {
    setDeleteTarget(target);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;
    setDeleteTarget(null);

    if (target.type === "student") {
      await handleRemoveStudent(target.id);
      return;
    }

    await handleRemoveCriterion(target.id);
  };

  const handleLocalAddCriteria = () => {
    const title = newLocalCriterionName.trim();
    if (!localTrack || localCriteriaConfirmed || !title) {
      return;
    }

    if (localTrack.criteria.length >= 5) {
      toast.error("평가 요소는 최대 5개까지 추가할 수 있습니다.");
      return;
    }

    const nextCriterion: TeacherCriterion = {
      id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      name: title,
      description: "",
    };

    persistLocalTrack((current) => ({
      ...current,
      criteria: [...current.criteria, nextCriterion],
    }));
    setNewLocalCriterionName("");
    toast.success("평가 요소를 추가했습니다.");
  };

  const handleApproveCriteria = async () => {
    if (!trackId) {
      toast.error("트랙 정보를 찾을 수 없습니다.");
      return;
    }

    if (!canApprove) {
      toast.error("평가지표는 3~5개이며 모든 제목이 입력되어야 합니다.");
      return;
    }

    setIsApproving(true);
    try {
      const approved = await approveCriteria(trackId);
      await refreshMatrixState();
      setApprovalStatus(approved.approvedCount > 0 ? "approved" : "already-approved");
      setEvaluationMessage(null);
      toast.success("평가지표를 확정하고 평가표를 불러왔습니다.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "평가지표 확정에 실패했습니다."
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleSaveScores = async () => {
    if (!trackId || !localTrack) {
      toast.error("트랙 정보를 찾을 수 없습니다.");
      return;
    }

    const scores = localTrack.scores
      .filter((score) => score.value !== "-")
      .map((score) => ({
        studentId: score.studentId,
        criterionId: score.criterionId,
        score: Number(score.value),
      }))
      .filter(
        (score) =>
          Number.isFinite(score.score) &&
          /^\d+$/.test(String(score.studentId)) &&
          /^\d+$/.test(String(score.criterionId))
      );

    setIsSavingScores(true);
    try {
      const message = await saveTrackEvaluations(trackId, scores);
      await refreshMatrixState();
      setEvaluationMessage(message ?? "점수를 저장했습니다.");
      toast.success("점수를 저장했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "점수 저장에 실패했습니다.");
    } finally {
      setIsSavingScores(false);
    }
  };

  const handleMatrixAddStudent = async (studentId: string) => {
    if (!trackId) {
      toast.error("트랙 정보를 찾을 수 없습니다.");
      return;
    }

    const student = students.find((item) => item.id === studentId);
    if (!student) {
      toast.error("추가할 학생 정보를 찾을 수 없습니다.");
      return;
    }

    setOpenMatrixStudentCombobox(false);
    setIsAddingMatrixStudent(false);

    if (localTrack?.students.some((item) => item.id === student.id)) {
      toast.error("이미 추가된 학생입니다.");
      return;
    }

    setIsMutatingMatrix(true);
    try {
      const message = await addStudentToTrack(trackId, student.loginId?.trim(), student.id);
      await refreshMatrixState();
      setEvaluationMessage(message);
      toast.success("학생이 추가되고 평가표가 갱신되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "학생 추가에 실패했습니다.");
    } finally {
      setIsMutatingMatrix(false);
    }
  };

  const handleMatrixAddCriterion = async () => {
    if (!trackId || !localTrack) {
      toast.error("트랙 정보를 찾을 수 없습니다.");
      return;
    }

    const title = newMatrixCriterionName.trim();
    if (!title) {
      toast.error("평가 요소 제목을 입력해주세요.");
      return;
    }

    if (localTrack.criteria.length >= 5) {
      toast.error("평가 요소는 최대 5개까지 추가할 수 있습니다.");
      return;
    }

    setIsMutatingMatrix(true);
    try {
      const message = await addCriterionToTrack(trackId, title);
      await refreshMatrixState();
      setEvaluationMessage(message);
      setNewMatrixCriterionName("");
      setIsAddingMatrixCriterion(false);
      toast.success("평가 요소가 추가되고 평가표가 갱신되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "평가 요소 추가에 실패했습니다.");
    } finally {
      setIsMutatingMatrix(false);
    }
  };

  const handleCancelMatrixStudentAdd = () => {
    setIsAddingMatrixStudent(false);
    setOpenMatrixStudentCombobox(false);
  };

  const handleCancelMatrixCriterionAdd = () => {
    setIsAddingMatrixCriterion(false);
    setNewMatrixCriterionName("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 text-center text-gray-600">트랙 상세 정보를 불러오는 중입니다...</Card>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="p-8 max-w-lg w-full text-center space-y-4">
          <p className="text-red-600 font-medium">{errorMessage}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => navigate("/teacher/tracks")}>
              트랙 목록으로
            </Button>
            <Button onClick={() => window.location.reload()}>다시 시도</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (localTrack && (isMatrixBacked || isLocalFallback)) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <AlertDialog
            open={deleteTarget !== null}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setDeleteTarget(null);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {deleteTarget?.type === "student"
                    ? `${deleteTarget.name} 학생을 삭제할까요?`
                    : `${deleteTarget?.name} 평가지표를 삭제할까요?`}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteTarget?.type === "student"
                    ? "학생 행과 연결된 점수가 함께 제거됩니다. 삭제 후에는 학생 추가에서 다시 복구할 수 있습니다."
                    : "평가지표 열과 연결된 학생 점수가 함께 제거됩니다."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    void confirmDelete();
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" onClick={() => navigate("/teacher/tracks")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              트랙 목록으로
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{isMatrixBacked ? "백엔드 평가표" : "로컬 세션 평가표"}</Badge>
              <Button
                variant="outline"
                onClick={() => navigate(`/teacher/track/${trackId}/review`)}
                className="gap-2"
              >
                <FileCheck className="w-4 h-4" />
                포트폴리오 검토
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{localTrack.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-2">{localTrack.assignmentDesc || localTrack.description}</p>
              <p className="text-xs text-gray-500 mt-2">트랙 ID: {localTrack.id}</p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-3">
                  <CardTitle className="text-2xl">평가 기준 및 점수 입력</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={localCriteriaConfirmed ? "bg-green-600" : "bg-amber-500"}>
                      {isMatrixBacked
                        ? "확정된 백엔드 평가 기준"
                        : localCriteriaConfirmed
                          ? "기준 확정됨"
                          : "기준 수정 중"}
                    </Badge>
                    <HoverCard openDelay={100}>
                      <HoverCardTrigger asChild>
                        <button type="button" className="text-sm text-slate-600 underline underline-offset-4">
                          편집 가능 조건 안내
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 text-sm leading-6">
                        {isMatrixBacked
                          ? "이 표는 백엔드에서 확정된 평가 기준을 기준으로 구성됩니다. 점수 변경 후 저장하면 서버에 즉시 반영됩니다."
                          : "기준 확정 전에는 평가 요소를 추가/삭제할 수 있고, 확정 후에는 점수 입력만 가능합니다. 수정이 필요하면 다시 기준 수정으로 전환하세요."}
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isMatrixBacked ? (
                    <Button onClick={handleSaveScores} disabled={isSavingScores}>
                      {isSavingScores ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          점수 저장 중...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          점수 저장
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleLocalCriteriaToggle}>
                      {localCriteriaConfirmed ? "기준 수정" : "기준 확정"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {evaluationMessage ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  최근 응답: {evaluationMessage}
                </div>
              ) : null}

              <div className="overflow-x-auto">
                <div className="min-w-max">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left p-4 bg-gray-100 font-semibold min-w-[150px]">학생</th>
                        {localTrack.criteria.map((criterion) => (
                          <th
                            key={criterion.id}
                            className="text-center p-4 bg-gray-100 font-semibold min-w-[120px]"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div>
                                <div className="font-medium">{criterion.name}</div>
                                {criterion.description ? (
                                  <div className="text-xs text-gray-500 font-normal mt-1">
                                    {criterion.description}
                                  </div>
                                ) : null}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  requestDelete({
                                    type: "criterion",
                                    id: criterion.id,
                                    name: criterion.name,
                                  })
                                }
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={
                                  isMutatingMatrix ||
                                  isSavingScores ||
                                  (localCriteriaConfirmed && !isMatrixBacked)
                                }
                                title={
                                  localCriteriaConfirmed && !isMatrixBacked
                                    ? "평가 요소 확정 후에는 삭제할 수 없습니다."
                                    : undefined
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {localTrack.students.map((student) => (
                        <tr key={student.id} className="border-b border-gray-200">
                          <td className="p-4 bg-gray-50">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-2">
                                <div className="font-medium">{student.name}</div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="text-xs text-gray-500">학생 ID {student.id}</div>
                                  {student.isApproved ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                      승인완료
                                    </Badge>
                                  ) : student.hasSubmitted ? (
                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                      검토대기
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  requestDelete({
                                    type: "student",
                                    id: student.id,
                                    name: student.name,
                                  })
                                }
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={isMutatingMatrix || isSavingScores}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                          {localTrack.criteria.map((criterion) => (
                            <td key={criterion.id} className="p-4 text-center">
                              <Select
                                value={getLocalScoreValue(localTrack, criterion.id, student.id)}
                                onValueChange={(value) =>
                                  handleLocalScoreChange(criterion.id, student.id, value)
                                }
                                disabled={!localCriteriaConfirmed && !isMatrixBacked}
                              >
                                <SelectTrigger className="w-[100px] mx-auto">
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="-">-</SelectItem>
                                  <SelectItem value="1">1점</SelectItem>
                                  <SelectItem value="2">2점</SelectItem>
                                  <SelectItem value="3">3점</SelectItem>
                                  <SelectItem value="4">4점</SelectItem>
                                  <SelectItem value="5">5점</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {isMatrixBacked ? (
                <div className="space-y-3">
                  <Label>항목 추가</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingMatrixStudent((prev) => !prev);
                        setIsAddingMatrixCriterion(false);
                        setNewMatrixCriterionName("");
                      }}
                      disabled={isMutatingMatrix || isSavingScores}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isAddingMatrixStudent ? "학생 추가 취소" : "학생 추가"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingMatrixCriterion((prev) => !prev);
                        setIsAddingMatrixStudent(false);
                        setOpenMatrixStudentCombobox(false);
                      }}
                      disabled={isMutatingMatrix || isSavingScores || localTrack.criteria.length >= 5}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isAddingMatrixCriterion ? "평가 요소 추가 취소" : "평가 요소 추가"}
                    </Button>
                  </div>

                  {isAddingMatrixStudent ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                      <Label>추가할 학생 선택</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Popover
                          open={openMatrixStudentCombobox}
                          onOpenChange={setOpenMatrixStudentCombobox}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openMatrixStudentCombobox}
                              className="w-full md:w-[320px] justify-between"
                              disabled={matrixAddableStudents.length === 0}
                            >
                              {matrixAddableStudents.length === 0 ? "추가 가능한 학생이 없습니다" : "학생 선택..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[320px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="학생 검색 (이름 또는 번호)..." />
                              <CommandList>
                                <CommandEmpty>
                                  {matrixAddableStudents.length === 0
                                    ? "추가 가능한 학생이 없습니다."
                                    : "검색 결과가 없습니다."}
                                </CommandEmpty>
                                <CommandGroup>
                                  {matrixAddableStudents.map((student) => (
                                    <CommandItem
                                      key={student.id}
                                      value={`${student.name} ${student.id} ${student.loginId ?? ""}`}
                                      onSelect={() => {
                                        void handleMatrixAddStudent(student.id);
                                      }}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                                      <div className="flex flex-col">
                                        <span>{student.name}</span>
                                        <span className="text-xs text-gray-500">
                                          학생 ID {student.id}
                                          {student.loginId ? ` · 로그인 ID ${student.loginId}` : ""}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        <Button
                          variant="outline"
                          onClick={handleCancelMatrixStudentAdd}
                          disabled={isMutatingMatrix || isSavingScores}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {isAddingMatrixCriterion ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                      <Label>평가 요소 제목</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={newMatrixCriterionName}
                          onChange={(event) => setNewMatrixCriterionName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void handleMatrixAddCriterion();
                            }
                          }}
                          placeholder="평가 요소 이름"
                          className="w-[220px]"
                          disabled={
                            isMutatingMatrix || isSavingScores || (localTrack?.criteria.length ?? 0) >= 5
                          }
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            void handleMatrixAddCriterion();
                          }}
                          disabled={
                            isMutatingMatrix || isSavingScores || (localTrack?.criteria.length ?? 0) >= 5
                          }
                        >
                          추가
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelMatrixCriterionAdd}
                          disabled={isMutatingMatrix || isSavingScores}
                        >
                          취소
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        최대 5개까지 추가할 수 있습니다.
                      </p>
                    </div>
                  ) : null}

                  <p className="text-xs text-gray-500">
                    학생 또는 평가 요소를 추가하면 서버 재조회 후 즉시 평가표에 반영됩니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label>평가 요소 추가</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={newLocalCriterionName}
                      onChange={(event) => setNewLocalCriterionName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleLocalAddCriteria();
                        }
                      }}
                      placeholder="평가 요소 이름"
                      className="w-[220px]"
                      disabled={localCriteriaConfirmed || localTrack.criteria.length >= 5}
                    />
                    <Button
                      variant="outline"
                      onClick={handleLocalAddCriteria}
                      disabled={localCriteriaConfirmed || localTrack.criteria.length >= 5}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      평가 요소 추가
                    </Button>
                  </div>
                  {localTrack.criteria.length >= 5 ? (
                    <p className="text-xs text-gray-500">평가 요소는 최대 5개까지 추가할 수 있습니다.</p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => navigate("/teacher/tracks")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            트랙 목록으로
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/teacher/track/${trackId}/review`)}
            className="gap-2"
          >
            <FileCheck className="w-4 h-4" />
            포트폴리오 검토
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-3xl">{trackName || `트랙 ${trackId}`}</CardTitle>
                {trackDescription ? (
                  <p className="text-sm text-gray-600 mt-2">강좌 분야: {trackDescription}</p>
                ) : null}
                <p className="text-xs text-gray-500 mt-2">트랙 ID: {trackId}</p>
              </div>
              {locationState?.isNew ? (
                <Badge className="bg-blue-600">생성 직후 추출 상태</Badge>
              ) : null}
            </div>
          </CardHeader>
        </Card>

        <Card>
            <CardHeader>
              <CardTitle className="text-2xl">평가지표 후보 검수/확정</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                백엔드가 생성한 후보를 검토한 뒤 현재 트랙의 미확정 평가 기준을 그대로 승인합니다.
              </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline">후보 {criteria.length}개</Badge>
              <Badge variant="outline">권장 3~5개</Badge>
              {approvalStatus ? <Badge className="bg-green-600">확정 상태: {approvalStatus}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              현재 화면에서는 후보 내용을 검토한 뒤 승인할 수 있습니다. 확정 후에는 백엔드 평가표로 전환되며,
              그때부터는 점수 저장 흐름을 사용합니다.
            </div>

            {criteria.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-sm text-gray-600">
                  아직 불러온 평가지표 후보가 없습니다.
                </CardContent>
              </Card>
            ) : null}

            {criteria.map((criterion, index) => (
              <Card key={criterion.key}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">평가지표 {index + 1}</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>제목</Label>
                      <Input
                        value={criterion.title}
                        readOnly
                        placeholder="평가지표 제목"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>설명</Label>
                      <Textarea
                        value={criterion.description}
                        readOnly
                        placeholder="평가지표 설명"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>우선순위</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={criterion.priority ?? ""}
                        readOnly
                        placeholder="예: 1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>플래그</Label>
                      <Input
                        value={criterion.flags ?? ""}
                        readOnly
                        placeholder="예: 확인 필요"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>근거 출처</Label>
                      <Textarea
                        value={criterion.sourceRefs ?? ""}
                        readOnly
                        placeholder="예: 강의안 p.15, 루브릭 섹션 2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleApproveCriteria} disabled={!canApprove || isApproving}>
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    확정 저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    평가지표 확정
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
              <CardTitle className="text-2xl">수강생 목록</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                강사-학생 매핑 API에서 가져온 학생 목록입니다. 각 학생의 승인 상태는 현재 화면의 배지로 함께 확인할 수 있습니다.
              </p>
              {isMatrixBacked ? (
                <p className="text-xs text-gray-500 mt-1">
                  삭제는 현재 프론트 저장 상태에 즉시 반영됩니다. 필요하면 학생 추가에서 다시 복구할 수 있습니다.
                </p>
              ) : null}
            </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-sm text-gray-600">연결된 학생이 없습니다.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border bg-white p-4"
                  >
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-gray-500">학생 ID {student.id}</div>
                    </div>
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">다음 단계</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              평가지표를 확정하면 백엔드 평가표를 불러와 학생별 점수를 직접 입력하고 저장할 수 있습니다.
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              확정 전에는 후보만 검토할 수 있습니다. 확정이 완료되면 이 상세 화면이 자동으로 백엔드 평가표로 전환되고,
              이후 점수 저장은 평가표 상단의 저장 버튼으로 처리됩니다.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
