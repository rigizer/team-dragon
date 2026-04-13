import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  fetchTrackPortfolios,
  type TrackPortfolioItem,
} from "../../api/instructor";
import {
  approveProjectPortfolio,
  reviewProjectPortfolio,
} from "../../api/portfolio";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ArrowLeft, Check, Download, ExternalLink, FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export function TeacherPortfolioReviewPage() {
  const navigate = useNavigate();
  const { trackId } = useParams();
  const [portfolios, setPortfolios] = useState<TrackPortfolioItem[]>([]);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPortfolios = async () => {
      if (!trackId) {
        if (!isMounted) return;
        setErrorMessage("트랙 정보를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      try {
        const result = await fetchTrackPortfolios(trackId);
        if (!isMounted) return;
        setPortfolios(result.portfolios);
        setServiceMessage(result.message);
        setErrorMessage(null);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "포트폴리오 목록을 불러오지 못했습니다."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPortfolios();

    return () => {
      isMounted = false;
    };
  }, [trackId]);

  const handleReview = async (projectId: number | null) => {
    if (projectId === null) {
      toast.error("아직 제출된 프로젝트가 없습니다.");
      return;
    }

    setActiveProjectId(projectId);
    setIsReviewing(true);
    setApprovalStatus(null);

    try {
      const nextUrl = await reviewProjectPortfolio(projectId);
      setPortfolioUrl(nextUrl);
      toast.success("포트폴리오 미리보기를 불러왔습니다.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "포트폴리오 미리보기를 불러오지 못했습니다.";
      setPortfolioUrl(null);
      toast.error(message);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleApprove = async (projectId: number | null, isApproved: boolean) => {
    if (projectId === null) {
      toast.error("아직 제출된 프로젝트가 없습니다.");
      return;
    }

    setIsApproving(true);
    try {
      const status = await approveProjectPortfolio(projectId, isApproved);
      setApprovalStatus(status ?? (isApproved ? "approved" : "rejected"));
      toast.success(isApproved ? "포트폴리오 승인 요청을 보냈습니다." : "포트폴리오 반려 요청을 보냈습니다.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "포트폴리오 승인 처리에 실패했습니다."
      );
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(`/teacher/track/${trackId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            트랙으로 돌아가기
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">트랙 포트폴리오 목록</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              학생별 제출 상태와 project_id를 바로 확인하고, 각 행에서 검토/승인을 진행합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-sm text-gray-600">포트폴리오 목록을 불러오는 중입니다...</div>
            ) : errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : serviceMessage ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                backend 응답 메시지: {serviceMessage}
              </div>
            ) : portfolios.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                조회 가능한 포트폴리오가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {portfolios.map((portfolio) => (
                  <Card key={`${portfolio.studentId}-${portfolio.studentName}`}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">{portfolio.studentName}</div>
                          <div className="text-xs text-gray-500">학생 ID {portfolio.studentId}</div>
                          <div className="text-xs text-gray-500">
                            프로젝트 ID {portfolio.projectId ?? "미제출"}
                          </div>
                        </div>
                        {portfolio.portfolioUrl ? (
                          <Button asChild variant="outline">
                            <a href={portfolio.portfolioUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              포트폴리오 열기
                            </a>
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-500">포트폴리오 URL 없음</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleReview(portfolio.projectId)}
                          disabled={portfolio.projectId === null || isReviewing}
                        >
                          {isReviewing && activeProjectId === portfolio.projectId ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              미리보기 조회 중...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              검토
                            </>
                          )}
                        </Button>
                        {activeProjectId === portfolio.projectId && portfolioUrl ? (
                          <>
                            <Button asChild variant="outline">
                              <a href={portfolioUrl} target="_blank" rel="noreferrer">
                                <Download className="w-4 h-4 mr-2" />
                                포트폴리오 열기
                              </a>
                            </Button>
                            <Button
                              onClick={() => handleApprove(portfolio.projectId, true)}
                              disabled={isApproving}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              승인
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleApprove(portfolio.projectId, false)}
                              disabled={isApproving}
                            >
                              <X className="w-4 h-4 mr-2" />
                              반려
                            </Button>
                          </>
                        ) : null}
                      </div>

                      {activeProjectId === portfolio.projectId && approvalStatus ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                          최근 승인 응답 상태: {approvalStatus}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
