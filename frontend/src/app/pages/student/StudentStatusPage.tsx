import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, CheckCircle, Clock, Download, FileText, XCircle } from "lucide-react";
import { fetchEmploymentPack } from "../../api/portfolio";
import { getStudentFlowProgress, saveStudentFlowProgress } from "../../data/studentFlowSession";
import {
  buildPackStateFromApiResponse,
  getLocalEmploymentPackState,
  type EmploymentPackState,
  type EmploymentPackStatus,
} from "../../data/studentPackState";

const STATUS_META: Record<EmploymentPackStatus, { label: string; className: string; summary: string }> = {
  pending: {
    label: "패킷 생성 대기",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    summary: "아직 다운로드 가능한 취업 제출 패킷이 없습니다. 강사 평가 또는 승인 절차가 남아 있을 수 있습니다.",
  },
  ready: {
    label: "패킷 다운로드 가능",
    className: "bg-green-500 text-white border-green-500",
    summary: "취업 제출 패킷 파일 URL이 준비되었습니다. 다운로드 페이지에서 바로 열 수 있습니다.",
  },
  denied: {
    label: "승인 거절 / 다운로드 불가",
    className: "bg-red-50 text-red-700 border-red-200",
    summary: "backend가 employment-pack 응답을 `denied` 로 반환했습니다. 현재 다운로드할 수 없습니다.",
  },
  provisional: {
    label: "잠정 상태",
    className: "bg-amber-50 text-amber-800 border-amber-300",
    summary: "로컬 데모 세션 기준으로 누락/차단 사유를 먼저 확인할 수 있습니다.",
  },
};

export function StudentStatusPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { trackId } = useParams();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const fallbackProgress = getStudentFlowProgress();
  const localPackState = getLocalEmploymentPackState({ trackId: trackId ?? null });
  const projectId = query.get("projectId") ?? (localPackState ? null : fallbackProgress.projectId);

  const [packState, setPackState] = useState<EmploymentPackState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (trackId) {
      saveStudentFlowProgress({ trackId, projectId: projectId ?? undefined });
    }

    const loadStatus = async () => {
      try {
        let result: EmploymentPackState | null = null;

        if (projectId) {
          try {
            const response = await fetchEmploymentPack(projectId);
            result = buildPackStateFromApiResponse(response.fileUrl, response.status, trackId ?? null);
          } catch {
            result = getLocalEmploymentPackState({ trackId: trackId ?? null });
          }
        } else {
          result = getLocalEmploymentPackState({ trackId: trackId ?? null });
        }

        if (!isMounted) return;

        if (!result) {
          setPackState(null);
          setErrorMessage("프로젝트 ID를 찾을 수 없습니다. 업로드 단계부터 다시 진행해주세요.");
          return;
        }

        setPackState(result);
        setErrorMessage(null);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "패킷 상태를 조회하지 못했습니다.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [projectId, trackId]);

  const status = packState?.status ?? null;
  const meta = status ? STATUS_META[status] : null;
  const canOpenDownload = Boolean(trackId && (projectId || status === "provisional"));
  const deniedCopy =
    status === "denied"
      ? "backend가 employment-pack 응답에서 denied를 반환했습니다. 강사 승인 상태를 다시 확인해야 합니다."
      : null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate("/student/tracks")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            트랙 목록으로
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-2xl">프로젝트 진행 상태</CardTitle>
              {meta ? (
                <Badge variant="outline" className={meta.className}>
                  {status === "ready" ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : status === "denied" ? (
                    <XCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <Clock className="w-3 h-3 mr-1" />
                  )}
                  {meta.label}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              trackId: {trackId ?? "없음"} / projectId: {projectId ?? "없음"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-gray-600">
                패킷 상태를 조회하는 중입니다...
              </div>
            ) : errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
                {errorMessage}
              </div>
            ) : meta ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
                {status === "ready" ? (
                  <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                ) : status === "denied" ? (
                  <XCircle className="w-12 h-12 mx-auto text-red-600" />
                ) : (
                  <Clock className="w-12 h-12 mx-auto text-slate-600" />
                )}
                <h3 className="text-lg font-semibold">{meta.label}</h3>
                <p className="text-gray-600">{meta.summary}</p>
                {deniedCopy ? <p className="text-sm font-medium text-red-700">{deniedCopy}</p> : null}
                {packState?.blockingReason ? (
                  <p className="text-sm font-medium text-amber-900">
                    누락/차단 사유: {packState.blockingReason}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div>
              <h4 className="font-medium mb-3">현재 backend에서 확인 가능한 정보</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>employment-pack endpoint 응답으로 다운로드 가능 여부를 확인합니다.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>criteria/scoring 세부 단계는 현재 공개 API 응답에서 직접 구분되지 않습니다.</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex gap-2">
              {canOpenDownload ? (
                <Button
                  onClick={() =>
                    navigate(
                      projectId
                        ? `/student/track/${trackId}/download?projectId=${encodeURIComponent(projectId)}`
                        : `/student/track/${trackId}/download`
                    )
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  다운로드 상태 보기
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => navigate("/student/tracks")}>
                트랙 목록으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
