import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { fetchContributionCandidates, type ContributionSuggestion } from "../../api/student";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { getStudentFlowProgress, saveStudentFlowProgress } from "../../data/studentFlowSession";
import { ArrowLeft } from "lucide-react";

export function StudentCompetencySelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { trackId } = useParams();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const fallbackProgress = getStudentFlowProgress();
  const projectId = query.get("projectId") ?? fallbackProgress.projectId;
  const locationState = (location.state as { projectName?: string; uploadedStatus?: string | null } | null) ?? null;

  const [suggestions, setSuggestions] = useState<ContributionSuggestion[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (trackId) {
      saveStudentFlowProgress({ trackId, projectId: projectId ?? null });
    }

    const loadSuggestions = async () => {
      if (!projectId) {
        if (!isMounted) return;
        setErrorMessage("프로젝트 ID를 찾을 수 없습니다. 업로드 단계부터 다시 진행해주세요.");
        setIsLoading(false);
        return;
      }

      try {
        const nextSuggestions = await fetchContributionCandidates(projectId);
        if (!isMounted) return;
        setSuggestions(nextSuggestions);
        setSelectedIndexes(new Set(nextSuggestions.map((_, index) => index)));
        setErrorMessage(null);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "기여도 후보를 불러오지 못했습니다."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSuggestions();

    return () => {
      isMounted = false;
    };
  }, [projectId, trackId]);

  const toggleSuggestion = (index: number) => {
    setSelectedIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleNext = () => {
    navigate(`/student/track/${trackId}/contribution?projectId=${encodeURIComponent(projectId ?? "")}`, {
      state: {
        selectedSuggestions: suggestions.filter((_, index) => selectedIndexes.has(index)),
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate("/student/tracks")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            트랙 목록으로
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">기여도 후보 검토</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              projectId: {projectId ?? "없음"}
              {locationState?.projectName ? ` / 프로젝트명: ${locationState.projectName}` : ""}
            </p>
            {locationState?.uploadedStatus ? (
              <p className="text-xs text-gray-500 mt-1">업로드 응답 상태: {locationState.uploadedStatus}</p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              backend는 역할/행동/결과/역량 suggestion 구조를 반환합니다. 선택한 후보는 다음 단계에서 수정해 저장합니다.
            </div>

            {isLoading ? (
              <div className="text-sm text-gray-600">기여도 후보를 불러오는 중입니다...</div>
            ) : errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : suggestions.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                backend가 반환한 후보가 없습니다. 다음 단계에서 수동으로 기여 정보를 입력할 수 있습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <Card key={`${suggestion.role}-${index}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedIndexes.has(index)}
                          onCheckedChange={() => toggleSuggestion(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{suggestion.role}</h3>
                            <Badge variant="outline">후보 {index + 1}</Badge>
                          </div>

                          {suggestion.actions.length > 0 ? (
                            <div>
                              <p className="text-sm font-medium mb-2">행동</p>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                {suggestion.actions.map((action, actionIndex) => (
                                  <li key={`${action}-${actionIndex}`}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {suggestion.results.length > 0 ? (
                            <div>
                              <p className="text-sm font-medium mb-2">결과</p>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                {suggestion.results.map((result, resultIndex) => (
                                  <li key={`${result}-${resultIndex}`}>{result}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {suggestion.skills.length > 0 ? (
                            <div>
                              <p className="text-sm font-medium mb-2">관련 역량</p>
                              <div className="flex flex-wrap gap-2">
                                {suggestion.skills.map((skill, skillIndex) => (
                                  <Badge key={`${skill}-${skillIndex}`} variant="secondary">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {suggestion.source ? (
                            <p className="text-xs text-gray-500">근거 출처: {suggestion.source}</p>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t">
              <p className="text-sm text-gray-600">{selectedIndexes.size}개 후보 선택됨</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/student/tracks")}>
                  취소
                </Button>
                <Button onClick={handleNext}>다음</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
