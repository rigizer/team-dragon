import { API_ENDPOINTS } from "../config/api";
import { requestJson, toOptionalString } from "./http";

interface PortfolioReviewResponse {
  portfolio_url: string;
}

interface ApprovePortfolioResponse {
  status?: string | null;
}

interface EmploymentPackResponse {
  file_url?: string | null;
  status?: string | null;
}

export async function reviewProjectPortfolio(projectId: string | number): Promise<string> {
  const data = await requestJson<PortfolioReviewResponse>(
    API_ENDPOINTS.projectReview(projectId),
    undefined,
    "포트폴리오 미리보기 조회에 실패했습니다."
  );

  const portfolioUrl = toOptionalString(data.portfolio_url);
  if (!portfolioUrl) {
    throw new Error("포트폴리오 URL이 없습니다.");
  }

  return portfolioUrl;
}

export async function approveProjectPortfolio(
  projectId: string | number,
  isApproved: boolean
): Promise<string | null> {
  const data = await requestJson<ApprovePortfolioResponse>(
    API_ENDPOINTS.projectApprove(projectId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_approved: isApproved }),
    },
    "포트폴리오 승인 처리에 실패했습니다."
  );

  return toOptionalString(data.status);
}

export async function fetchEmploymentPack(
  projectId: string | number
): Promise<{ fileUrl: string | null; status: string | null }> {
  const data = await requestJson<EmploymentPackResponse>(
    API_ENDPOINTS.projectEmploymentPack(projectId),
    undefined,
    "취업 제출 패킷 조회에 실패했습니다."
  );

  return {
    fileUrl: toOptionalString(data.file_url),
    status: toOptionalString(data.status),
  };
}
