import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { uploadProject } from "../../api/student";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { saveStudentFlowProgress } from "../../data/studentFlowSession";

export function StudentPortfolioUploadPage() {
  const navigate = useNavigate();
  const { trackId } = useParams();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [presentationLink, setPresentationLink] = useState("");
  const [deployLink, setDeployLink] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }

    const newFiles = Array.from(event.target.files).filter(
      (file) => file.type === "application/pdf"
    );

    if (newFiles.length !== event.target.files.length) {
      toast.error("PDF 파일만 업로드 가능합니다.");
    }

    setUploadedFiles((current) => [...current, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSubmit = async () => {
    if (!trackId) {
      toast.error("트랙 정보를 찾을 수 없습니다.");
      return;
    }

    if (!projectName.trim()) {
      toast.error("프로젝트명을 입력해주세요.");
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error("프로젝트 PDF를 최소 1개 이상 업로드해주세요.");
      return;
    }

    const studentId = localStorage.getItem("userId")?.trim();
    if (!studentId) {
      toast.error("로그인한 수강생 정보를 찾을 수 없습니다.");
      return;
    }

    setIsUploading(true);

    try {
      const uploadedProject = await uploadProject({
        studentId,
        trackId,
        title: projectName.trim(),
        projectFiles: uploadedFiles,
        projectLink: projectLink.trim() || undefined,
        extraLinks: [githubLink, presentationLink, deployLink].filter(Boolean),
      });

      saveStudentFlowProgress({
        trackId,
        projectId: String(uploadedProject.projectId),
      });

      toast.success(`프로젝트가 업로드되었습니다. 상태: ${uploadedProject.status ?? "uploaded"}`);
      navigate(
        `/student/track/${trackId}/competency?projectId=${encodeURIComponent(String(uploadedProject.projectId))}`,
        {
          state: {
            projectName: projectName.trim(),
            uploadedStatus: uploadedProject.status,
          },
        }
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "프로젝트 업로드에 실패했습니다."
      );
    } finally {
      setIsUploading(false);
    }
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
            <CardTitle className="text-2xl">프로젝트 업로드</CardTitle>
            <p className="text-sm text-gray-600 mt-2">트랙 ID: {trackId}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="projectName">프로젝트명</Label>
                <Input
                  id="projectName"
                  placeholder="예: 온라인 쇼핑몰 개선"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="projectLink">대표 링크 (선택)</Label>
                <Input
                  id="projectLink"
                  type="url"
                  placeholder="예: https://portfolio.example.com/project"
                  value={projectLink}
                  onChange={(event) => setProjectLink(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubLink">GitHub (선택)</Label>
                <Input
                  id="githubLink"
                  type="url"
                  placeholder="예: https://github.com/your/repo"
                  value={githubLink}
                  onChange={(event) => setGithubLink(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="presentationLink">발표자료 링크 (선택)</Label>
                <Input
                  id="presentationLink"
                  type="url"
                  placeholder="예: https://slides.com/your/presentation"
                  value={presentationLink}
                  onChange={(event) => setPresentationLink(event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deployLink">배포 URL (선택)</Label>
                <Input
                  id="deployLink"
                  type="url"
                  placeholder="예: https://your-app.example.com"
                  value={deployLink}
                  onChange={(event) => setDeployLink(event.target.value)}
                />
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                project_pdf multipart 필드로 전송할 PDF를 선택하세요.
              </p>
              <input
                type="file"
                multiple
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                파일 선택
              </Button>
            </div>

            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">업로드할 파일 ({uploadedFiles.length})</p>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <span className="text-sm">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/student/tracks")}
                disabled={isUploading}
              >
                취소
              </Button>
              <Button onClick={handleSubmit} disabled={isUploading || uploadedFiles.length === 0}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  "다음"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
