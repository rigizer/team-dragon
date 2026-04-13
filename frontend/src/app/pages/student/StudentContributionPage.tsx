import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { updateProjectContributions, type ContributionSuggestion } from "../../api/student";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getStudentFlowProgress, saveStudentFlowProgress } from "../../data/studentFlowSession";

function splitLines(value: string): string[] {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function StudentContributionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { trackId } = useParams();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const fallbackProgress = getStudentFlowProgress();
  const projectId = query.get("projectId") ?? fallbackProgress.projectId;
  const locationState =
    (location.state as { selectedSuggestions?: ContributionSuggestion[] } | null) ?? null;
  const selectedSuggestions = locationState?.selectedSuggestions ?? [];

  const [role, setRole] = useState(selectedSuggestions[0]?.role ?? "");
  const [personalContribution, setPersonalContribution] = useState("");
  const [teamOutcome, setTeamOutcome] = useState("");
  const [personalOutcome, setPersonalOutcome] = useState("");
  const [extraComment, setExtraComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!trackId || !projectId) {
      toast.error("프로젝트 ID를 찾을 수 없습니다. 업로드 단계부터 다시 진행해주세요.");
      return;
    }

    const normalizedRole = role.trim() || selectedSuggestions[0]?.role || "";
    if (!normalizedRole) {
      toast.error("역할 정보를 입력해주세요.");
      return;
    }

    const mergedSuggestions =
      selectedSuggestions.length > 0
        ? selectedSuggestions.map((suggestion, index) => {
            if (index !== 0) {
              return suggestion;
            }

            return {
              ...suggestion,
              role: normalizedRole,
              actions: dedupe([...suggestion.actions, ...splitLines(personalContribution)]),
              results: dedupe([
                ...suggestion.results,
                teamOutcome.trim() ? `팀 결과: ${teamOutcome.trim()}` : "",
                personalOutcome.trim() ? `개인 결과: ${personalOutcome.trim()}` : "",
                extraComment.trim() ? `[추가 코멘트] ${extraComment.trim()}` : "",
              ]),
            };
          })
        : [
            {
              role: normalizedRole,
              actions: splitLines(personalContribution),
              results: dedupe([
                teamOutcome.trim() ? `팀 결과: ${teamOutcome.trim()}` : "",
                personalOutcome.trim() ? `개인 결과: ${personalOutcome.trim()}` : "",
                extraComment.trim() ? `[추가 코멘트] ${extraComment.trim()}` : "",
              ]),
              skills: [],
              source: null,
            },
          ];

    if (
      mergedSuggestions.every(
        (suggestion) => suggestion.actions.length === 0 && suggestion.results.length === 0
      )
    ) {
      toast.error("개인 기여 또는 결과 정보를 최소 1개 이상 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const status = await updateProjectContributions(projectId, {
        suggestions: mergedSuggestions.map((suggestion) => ({
          role: suggestion.role,
          actions: suggestion.actions,
          results: suggestion.results,
          skills: suggestion.skills,
        })),
      });

      saveStudentFlowProgress({ trackId, projectId: String(projectId) });
      toast.success(`기여 입력이 저장되었습니다.${status ? ` (status: ${status})` : ""}`);
      navigate(`/student/track/${trackId}/status?projectId=${encodeURIComponent(String(projectId))}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "기여 입력 저장에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            이전으로
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">기여도 입력</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              projectId: {projectId ?? "없음"}
              {trackId ? ` / trackId: ${trackId}` : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              backend 저장 스키마는 `role/actions/results/skills` 구조입니다. 따라서 팀 결과/개인 결과/추가 코멘트는
              결과 항목 문자열로 병합해 저장합니다.
            </div>

            {selectedSuggestions.length > 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">선택한 backend 후보 {selectedSuggestions.length}개</span>
                    {selectedSuggestions[0]?.skills.map((skill, index) => (
                      <Badge key={`${skill}-${index}`} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    {selectedSuggestions.map((suggestion, index) => (
                      <div key={`${suggestion.role}-${index}`} className="rounded border bg-white p-3">
                        <div className="font-medium">{suggestion.role}</div>
                        {suggestion.actions.length > 0 ? (
                          <div className="mt-1">행동: {suggestion.actions.join(", ")}</div>
                        ) : null}
                        {suggestion.results.length > 0 ? (
                          <div className="mt-1">결과: {suggestion.results.join(", ")}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="role">본인 역할</Label>
                <Input
                  id="role"
                  placeholder="예: 백엔드 API 설계 및 인증 흐름 담당"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="personalContribution">개인 기여 설명</Label>
                <Textarea
                  id="personalContribution"
                  placeholder="한 줄에 하나씩 행동/기여를 적어주세요"
                  value={personalContribution}
                  onChange={(event) => setPersonalContribution(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamOutcome">팀 결과</Label>
                <Textarea
                  id="teamOutcome"
                  placeholder="예: 주문/결제 기능 데모 완성"
                  value={teamOutcome}
                  onChange={(event) => setTeamOutcome(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalOutcome">개인 결과</Label>
                <Textarea
                  id="personalOutcome"
                  placeholder="예: API 설계 정리 및 예외 처리 개선"
                  value={personalOutcome}
                  onChange={(event) => setPersonalOutcome(event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="extraComment">추가 코멘트</Label>
                <Textarea
                  id="extraComment"
                  placeholder="저장 시 결과 항목 메모로 함께 전송됩니다"
                  value={extraComment}
                  onChange={(event) => setExtraComment(event.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => navigate("/student/tracks")}>
                취소
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "완료"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
