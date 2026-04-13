import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { fetchStudentTracks, type StudentTrackSummary } from "../../api/student";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { getStudentFlowProgress, saveStudentFlowProgress } from "../../data/studentFlowSession";
import {
  activateLocalProvisionalStudentPack,
  getLocalEmploymentPackState,
  getLocalStudentTrackFallbacks,
  getStudentSessionStudentId,
} from "../../data/studentPackState";
import { FileText, Upload } from "lucide-react";

type StudentTrackCard =
  | { kind: "api"; id: string; name: string }
  | {
      kind: "local";
      id: string;
      name: string;
      badgeText: string;
      blockingReason: string;
      actionLabel: string;
      statusPath: string;
    };

export function StudentTrackListPage() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<StudentTrackSummary[]>([]);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const progress = useMemo(() => getStudentFlowProgress(), []);
  const localFallbackTracks = useMemo(() => getLocalStudentTrackFallbacks(), []);

  const visibleTracks = useMemo(() => {
    if (tracks.length > 0) {
      return tracks.map<StudentTrackCard>((track) => ({ kind: "api", id: track.id, name: track.name }));
    }

    return localFallbackTracks.map<StudentTrackCard>((track) => ({
      kind: "local",
      id: track.id,
      name: track.name,
      badgeText: track.badgeText,
      blockingReason: track.blockingReason,
      actionLabel: track.actionLabel,
      statusPath: track.statusPath,
    }));
  }, [localFallbackTracks, tracks]);

  useEffect(() => {
    let isMounted = true;

    const loadTracks = async () => {
      const studentId = getStudentSessionStudentId();

      if (!studentId) {
        if (!isMounted) return;
        setTracks([]);
        setServiceMessage(null);
        setErrorMessage(localFallbackTracks.length > 0 ? null : "로그인한 수강생 정보를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      try {
        const result = await fetchStudentTracks(studentId);
        if (!isMounted) return;
        setTracks(result.tracks);
        setServiceMessage(result.message);
        setErrorMessage(null);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "수강생 트랙 목록을 불러오지 못했습니다."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTracks();

    return () => {
      isMounted = false;
    };
  }, [localFallbackTracks.length]);

  const handleLocalFallbackOpen = (track: Extract<StudentTrackCard, { kind: "local" }>) => {
    activateLocalProvisionalStudentPack();
    saveStudentFlowProgress({ trackId: track.id });
    navigate(track.statusPath);
  };

  const progressLocalPackState = progress.trackId
    ? getLocalEmploymentPackState({ trackId: progress.trackId })
    : null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">내 트랙</h1>
          <p className="text-gray-600 mt-2">
            수강생 트랙 목록은 API 응답을 우선 렌더링하고, 응답이 없거나 실패한 경우에만 로컬 데모 트랙을 보여줍니다.
          </p>
        </div>

        {progress.trackId ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">최근 진행한 프로젝트</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
              <span>
                최근 진행 trackId: {progress.trackId}
                {progress.projectId && progressLocalPackState?.status !== "provisional"
                  ? ` / projectId: ${progress.projectId}`
                  : ""}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  if (progressLocalPackState?.status === "provisional") {
                    navigate(`/student/track/${progress.trackId}/status`);
                    return;
                  }

                  if (progress.projectId) {
                    navigate(
                      `/student/track/${progress.trackId}/status?projectId=${encodeURIComponent(progress.projectId)}`
                    );
                    return;
                  }

                  navigate(`/student/track/${progress.trackId}/upload`);
                }}
              >
                이어서 보기
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && errorMessage && visibleTracks.length > 0 ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6 text-sm text-amber-800">{errorMessage}</CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <Card className="p-12">
            <div className="text-center text-gray-600">트랙 목록을 불러오는 중입니다...</div>
          </Card>
        ) : visibleTracks.length > 0 ? (
          <div className="space-y-4">
            {visibleTracks.map((track) =>
              track.kind === "local" ? (
                <Card
                  key={track.id}
                  className="border-amber-200 bg-amber-50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleLocalFallbackOpen(track)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-xl">{track.name}</CardTitle>
                          <Badge variant="outline" className="border-amber-300 text-amber-800">
                            {track.badgeText}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{track.blockingReason}</p>
                      </div>
                      <Badge variant="outline">트랙 ID {track.id}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4 text-sm text-gray-600">
                    <span>로컬 데모 세션에서 누락 사유를 먼저 확인할 수 있습니다.</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleLocalFallbackOpen(track);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {track.actionLabel}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card
                  key={track.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/student/track/${track.id}/upload`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl">{track.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-2">API 응답에 포함된 트랙 정보를 기준으로 진행합니다.</p>
                      </div>
                      <Badge variant="outline">트랙 ID {track.id}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4 text-sm text-gray-600">
                    <span>프로젝트 증빙을 업로드해 다음 단계를 시작하세요.</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/student/track/${track.id}/upload`);
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      프로젝트 업로드
                    </Button>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        ) : errorMessage ? (
          <Card className="p-12">
            <div className="text-center space-y-3">
              <p className="text-red-600 font-medium">{errorMessage}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                다시 시도
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-12">
            <div className="text-center space-y-3">
              <FileText className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="text-lg font-semibold">표시할 트랙이 없습니다</h3>
              {serviceMessage ? (
                <p className="text-sm text-gray-600">backend 응답: {serviceMessage}</p>
              ) : (
                <p className="text-sm text-gray-600">수강생 트랙 목록이 비어 있습니다.</p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
