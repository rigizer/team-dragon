import { useState } from "react";
import { useNavigate } from "react-router";
import { createInstructorTrack } from "../../api/instructor";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

export function TeacherTrackCreatePage() {
  const navigate = useNavigate();
  const [trackName, setTrackName] = useState("");
  const [domainType, setDomainType] = useState("");
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "material" | "rubric"
  ) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      toast.error("PDF 파일만 업로드 가능합니다.");
      event.target.value = "";
      return;
    }

    if (type === "material") {
      setMaterialFile(selectedFile);
      return;
    }

    setRubricFile(selectedFile);
  };

  const removeFile = (type: "material" | "rubric") => {
    if (type === "material") {
      setMaterialFile(null);
      return;
    }

    setRubricFile(null);
  };

  const handleSubmit = async () => {
    if (!trackName.trim()) {
      toast.error("트랙 이름을 입력해주세요.");
      return;
    }

    if (!domainType.trim()) {
      toast.error("강좌 분야를 입력해주세요.");
      return;
    }

    if (!materialFile) {
      toast.error("강의 자료 PDF를 업로드해주세요.");
      return;
    }

    if (!rubricFile) {
      toast.error("루브릭 PDF를 업로드해주세요.");
      return;
    }

    const instructorId = localStorage.getItem("userId")?.trim();
    if (!instructorId) {
      toast.error("로그인한 강사 정보를 찾을 수 없습니다.");
      return;
    }

    setIsUploading(true);

    try {
      const createdTrack = await createInstructorTrack(instructorId, {
        name: trackName.trim(),
        domainType: domainType.trim(),
        materialFile,
        rubricFile,
      });

      toast.success("트랙이 생성되었습니다.");
      navigate(`/teacher/track/${createdTrack.track_id}`, {
        state: {
          trackName: trackName.trim(),
          trackDescription: domainType.trim(),
          isNew: createdTrack.status === "extracted",
        },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "트랙 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate("/teacher/tracks")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            트랙 목록으로
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">새 트랙 생성</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              현재 live backend는 트랙명, 강좌 분야, 강의자료 PDF, 루브릭 PDF만 저장합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="trackName">트랙 이름</Label>
              <Input
                id="trackName"
                placeholder="예: 백엔드 개발 기초"
                value={trackName}
                onChange={(event) => setTrackName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domainType">강좌 분야</Label>
              <Input
                id="domainType"
                placeholder="예: IT"
                value={domainType}
                onChange={(event) => setDomainType(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>강의자료 (PDF)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  PDF 파일을 드래그하거나 클릭하여 업로드하세요
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => handleFileChange(event, "material")}
                  className="hidden"
                  id="material-file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("material-file-upload")?.click()}
                >
                  파일 선택
                </Button>
              </div>

              {materialFile ? (
                <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm">{materialFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile("material")}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>루브릭 (PDF)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  PDF 파일을 드래그하거나 클릭하여 업로드하세요
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => handleFileChange(event, "rubric")}
                  className="hidden"
                  id="rubric-file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("rubric-file-upload")?.click()}
                >
                  파일 선택
                </Button>
              </div>

              {rubricFile ? (
                <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm">{rubricFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile("rubric")}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/teacher/tracks")}
                disabled={isUploading}
              >
                취소
              </Button>
              <Button onClick={handleSubmit} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    트랙 생성 중...
                  </>
                ) : (
                  "트랙 생성"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
