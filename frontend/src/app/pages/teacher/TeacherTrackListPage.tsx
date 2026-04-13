import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { fetchInstructorTracks, type InstructorTrackSummary } from "../../api/instructor";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { FileCheck, FileText, Plus } from "lucide-react";

export function TeacherTrackListPage() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<InstructorTrackSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTracks = async () => {
      const instructorId = localStorage.getItem("userId")?.trim();
      if (!instructorId) {
        if (!isMounted) return;
        setErrorMessage("로그인한 강사 정보를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      try {
        const nextTracks = await fetchInstructorTracks(instructorId);
        if (!isMounted) return;
        setTracks(nextTracks);
        setErrorMessage(null);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "트랙 목록을 불러오지 못했습니다."
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
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">트랙 현황</h1>
            <p className="text-gray-600 mt-2">
              live backend에서 강사 트랙 목록을 불러옵니다. 세부 기준/학생 정보는 상세 화면에서 조회합니다.
            </p>
          </div>
          <Button onClick={() => navigate("/teacher/track/create")} className="gap-2">
            <Plus className="w-4 h-4" />
            트랙 생성
          </Button>
        </div>

        {isLoading ? (
          <Card className="p-12">
            <div className="text-center text-gray-600">트랙 목록을 불러오는 중입니다...</div>
          </Card>
        ) : errorMessage ? (
          <Card className="p-12">
            <div className="text-center space-y-3">
              <p className="text-red-600 font-medium">{errorMessage}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                다시 시도
              </Button>
            </div>
          </Card>
        ) : tracks.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">등록된 트랙이 없습니다</h3>
              <p className="text-gray-600 mb-4">새 트랙을 생성하면 여기에 표시됩니다.</p>
              <Button onClick={() => navigate("/teacher/track/create")}>첫 트랙 만들기</Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tracks.map((track) => (
              <Card
                key={track.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() =>
                  navigate(`/teacher/track/${track.id}`, {
                    state: {
                      trackName: track.name,
                    },
                  })
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">{track.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-2">
                        상세 화면에서 평가지표 후보, 학생 목록, 평가 처리 API를 조회합니다.
                      </p>
                    </div>
                    <Badge variant="outline">트랙 ID {track.id}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 text-sm text-gray-600">
                  <span>live backend 기준 기본 정보만 제공됩니다.</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/teacher/track/${track.id}/review`);
                      }}
                    >
                      <FileCheck className="w-4 h-4 mr-2" />
                      포트폴리오 검토
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/teacher/track/${track.id}`, {
                          state: {
                            trackName: track.name,
                          },
                        });
                      }}
                    >
                      상세 보기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
