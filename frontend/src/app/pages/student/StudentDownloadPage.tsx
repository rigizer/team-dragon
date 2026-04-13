import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, CheckCircle, Download, ExternalLink, Loader2, XCircle } from "lucide-react";
import { fetchEmploymentPack } from "../../api/portfolio";
import { getStudentFlowProgress, saveStudentFlowProgress } from "../../data/studentFlowSession";
import {
  buildPackStateFromApiResponse,
  getLocalEmploymentPackState,
  type EmploymentPackState,
  type EmploymentPackStatus,
} from "../../data/studentPackState";

const STATUS_LABEL: Record<EmploymentPackStatus, string> = {
  pending: "패킷 생성 대기",
  ready: "패킷 다운로드 가능",
  denied: "승인 거절 / 다운로드 불가",
  provisional: "잠정 상태",
};

export function StudentDownloadPage() {
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

    const loadPack = async () => {
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
          setErrorMessage("프로젝트 ID를 찾을 수 없습니다.");
          return;
        }

        setPackState(result);
        setErrorMessage(null);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "패킷 다운로드 정보를 조회하지 못했습니다."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPack();

    return () => {
      isMounted = false;
    };
  }, [projectId, trackId]);

  const status = packState?.status ?? null;
  const fileUrl = packState?.fileUrl ?? null;

  const openPack = () => {
    if (!fileUrl) {
      return;
    }

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

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
              <CardTitle className="text-2xl">취업 제출 패킷</CardTitle>
              {status ? <Badge variant="outline">{STATUS_LABEL[status]}</Badge> : null}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              trackId: {trackId ?? "없음"} / projectId: {projectId ?? "없음"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-gray-600">
                <Loader2 className="w-5 h-5 mx-auto mb-3 animate-spin" />
                패킷 다운로드 정보를 조회하는 중입니다...
              </div>
            ) : errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
                {errorMessage}
              </div>
            ) : status === "ready" && fileUrl ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-4">
                <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold">패킷이 준비되었습니다</h3>
                  <p className="text-gray-600 mt-2">backend가 반환한 file_url을 바로 열 수 있습니다.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={openPack}>
                    <Download className="w-4 h-4 mr-2" />
                    패킷 열기
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/student/result?projectId=${encodeURIComponent(projectId ?? "")}`)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    결과 화면 보기
                  </Button>
                </div>
              </div>
            ) : status === "denied" ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-3">
                <XCircle className="w-12 h-12 mx-auto text-red-600" />
                <h3 className="text-lg font-semibold">패킷 다운로드가 거절되었습니다</h3>
                <p className="text-gray-700">
                  employment-pack endpoint가 `denied` 를 반환했습니다. 강사 승인 상태를 다시 확인해야 합니다.
                </p>
              </div>
            ) : status === "provisional" ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center space-y-3">
                <h3 className="text-lg font-semibold">잠정 상태</h3>
                {packState?.blockingReason ? (
                  <p className="text-gray-700">누락/차단 사유: {packState.blockingReason}</p>
                ) : null}
                {packState?.previewBlockingReason ? (
                  <p className="text-gray-700">
                    패킷 미리보기에서 현재 상태와 누락/차단 사유({packState.previewBlockingReason})를 함께 확인할 수 있습니다.
                  </p>
                ) : null}
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => navigate("/student/result")}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    패킷 미리보기
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center space-y-3">
                <h3 className="text-lg font-semibold">아직 다운로드 가능한 패킷이 없습니다</h3>
                <p className="text-gray-700">
                  backend가 file_url을 반환하지 않았습니다. 상태 페이지에서 현재 진행 상태를 확인하세요.
                </p>
              </div>
            )}

            <div className="pt-4 border-t flex gap-2">
              {trackId ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      projectId
                        ? `/student/track/${trackId}/status?projectId=${encodeURIComponent(projectId)}`
                        : `/student/track/${trackId}/status`
                    )
                  }
                >
                  상태 페이지로 이동
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
