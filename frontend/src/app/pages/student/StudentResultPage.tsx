import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, Download, ExternalLink, Loader2 } from "lucide-react";
import { fetchEmploymentPack } from "../../api/portfolio";
import { getStudentFlowProgress } from "../../data/studentFlowSession";
import {
  buildPackStateFromApiResponse,
  getLocalEmploymentPackState,
  type EmploymentPackState,
  type EmploymentPackStatus,
} from "../../data/studentPackState";

const STATUS_LABEL: Record<EmploymentPackStatus, string> = {
  pending: "패킷 생성 대기",
  ready: "패킷 준비 완료",
  denied: "승인 거절",
  provisional: "잠정 상태",
};

export function StudentResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const fallbackProgress = getStudentFlowProgress();
  const localPackState = getLocalEmploymentPackState({ trackId: fallbackProgress.trackId });
  const projectId = query.get("projectId") ?? (localPackState ? null : fallbackProgress.projectId);

  const [packState, setPackState] = useState<EmploymentPackState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadResult = async () => {
      try {
        let result: EmploymentPackState | null = null;

        if (projectId) {
          try {
            const response = await fetchEmploymentPack(projectId);
            result = buildPackStateFromApiResponse(
              response.fileUrl,
              response.status,
              fallbackProgress.trackId ?? null
            );
          } catch {
            result = getLocalEmploymentPackState({ trackId: fallbackProgress.trackId ?? null });
          }
        } else {
          result = getLocalEmploymentPackState({ trackId: fallbackProgress.trackId ?? null });
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
        setErrorMessage(error instanceof Error ? error.message : "결과 정보를 조회하지 못했습니다.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadResult();

    return () => {
      isMounted = false;
    };
  }, [fallbackProgress.trackId, projectId]);

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전으로
          </Button>
          {status ? <Badge variant="outline">{STATUS_LABEL[status]}</Badge> : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">결과 화면</CardTitle>
            <p className="text-sm text-gray-600 mt-2">projectId: {projectId ?? "없음"}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-gray-600">
                <Loader2 className="w-5 h-5 mx-auto mb-3 animate-spin" />
                결과 정보를 조회하는 중입니다...
              </div>
            ) : errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
                {errorMessage}
              </div>
            ) : status === "ready" && fileUrl ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-6 space-y-4">
                <h3 className="text-lg font-semibold">패킷 파일이 준비되었습니다</h3>
                <p className="text-sm text-gray-700">
                  현재 공개 backend 응답은 employment-pack file_url만 제공합니다. 예전 mock UI가 보여주던 포트폴리오 요약/관련 직무 추천은 현재 API 스펙에 없습니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={openPack}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    패킷 열기
                  </Button>
                  <Button variant="outline" onClick={openPack}>
                    <Download className="w-4 h-4 mr-2" />
                    패킷 다운로드
                  </Button>
                </div>
              </div>
            ) : status === "denied" ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                강사 승인 상태 때문에 패킷 다운로드가 거절되었습니다.
              </div>
            ) : status === "provisional" ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 space-y-3">
                <p>누락/차단 사유: {packState?.blockingReason ?? "개인 기여 설명과 배포 링크가 누락되었습니다."}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-sm text-blue-800">
                아직 패킷 파일이 생성되지 않았습니다. 상태/다운로드 화면에서 다시 확인하세요.
              </div>
            )}

            <Card className="border-dashed">
              <CardContent className="pt-6 text-sm text-gray-700 space-y-2">
                <p className="font-medium">현재 공개 API 기준 제한 사항</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>관련 직무 추천 endpoint는 live OpenAPI에 노출되어 있지 않습니다.</li>
                  <li>텍스트 기반 포트폴리오 요약/핵심 역량 요약 response도 현재 공개 스펙에 없습니다.</li>
                  <li>따라서 이 화면은 패킷 파일 준비 여부를 truthfully 보여주는 역할만 수행합니다.</li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
