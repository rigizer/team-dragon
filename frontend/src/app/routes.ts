import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { TeacherUploadPage } from "./pages/teacher/TeacherUploadPage";
import { TeacherCriteriaPage } from "./pages/teacher/TeacherCriteriaPage";
import { TeacherTrackListPage } from "./pages/teacher/TeacherTrackListPage";
import { TeacherTrackCreatePage } from "./pages/teacher/TeacherTrackCreatePage";
import { TeacherTrackDetailPage } from "./pages/teacher/TeacherTrackDetailPage";
import { TeacherPortfolioReviewPage } from "./pages/teacher/TeacherPortfolioReviewPage";
import { StudentLoginPage } from "./pages/student/StudentLoginPage";
import { StudentUploadPage } from "./pages/student/StudentUploadPage";
import { StudentContributionPage } from "./pages/student/StudentContributionPage";
import { StudentResultPage } from "./pages/student/StudentResultPage";
import { StudentTrackListPage } from "./pages/student/StudentTrackListPage";
import { StudentPortfolioUploadPage } from "./pages/student/StudentPortfolioUploadPage";
import { StudentCompetencySelectionPage } from "./pages/student/StudentCompetencySelectionPage";
import { StudentStatusPage } from "./pages/student/StudentStatusPage";
import { StudentDownloadPage } from "./pages/student/StudentDownloadPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  // Teacher routes - new flow
  {
    path: "/teacher/tracks",
    Component: TeacherTrackListPage,
  },
  {
    path: "/teacher/track/create",
    Component: TeacherTrackCreatePage,
  },
  {
    path: "/teacher/track/:trackId",
    Component: TeacherTrackDetailPage,
  },
  {
    path: "/teacher/track/:trackId/review",
    Component: TeacherPortfolioReviewPage,
  },
  // Teacher routes - old (kept for compatibility)
  {
    path: "/teacher/upload",
    Component: TeacherUploadPage,
  },
  {
    path: "/teacher/criteria",
    Component: TeacherCriteriaPage,
  },
  // Student routes
  {
    path: "/student/login",
    Component: StudentLoginPage,
  },
  {
    path: "/student/tracks",
    Component: StudentTrackListPage,
  },
  {
    path: "/student/track/:trackId/upload",
    Component: StudentPortfolioUploadPage,
  },
  {
    path: "/student/track/:trackId/competency",
    Component: StudentCompetencySelectionPage,
  },
  {
    path: "/student/track/:trackId/contribution",
    Component: StudentContributionPage,
  },
  {
    path: "/student/track/:trackId/status",
    Component: StudentStatusPage,
  },
  {
    path: "/student/track/:trackId/download",
    Component: StudentDownloadPage,
  },
  // Student routes - old (kept for compatibility)
  {
    path: "/student/upload",
    Component: StudentUploadPage,
  },
  {
    path: "/student/contribution",
    Component: StudentContributionPage,
  },
  {
    path: "/student/result",
    Component: StudentResultPage,
  },
]);
