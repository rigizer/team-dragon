import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        (file) => file.type === "application/pdf"
      );
      if (newFiles.length !== e.target.files.length) {
        toast.error("PDF 파일만 업로드 가능합니다.");
      }
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!courseName.trim()) {
      toast.error("과정/트랙명을 입력해주세요.");
      return;
    }

    if (files.length === 0) {
      toast.error("최소 1개 이상의 PDF 파일을 업로드해주세요.");
      return;
    }

    toast.success("파일 업로드 완료! 루브릭을 생성합니다...");

    // Mock API call - 실제로는 백엔드에 파일 업로드
    // const formData = new FormData();
    // formData.append('courseName', courseName);
    // formData.append('description', assignmentDescription);
    // files.forEach(file => formData.append('files', file));
    // await fetch('/api/upload', { method: 'POST', body: formData });

    // 루브릭 페이지로 이동 (데이터 전달)
    navigate("/rubric", {
      state: {
        courseName,
        assignmentDescription,
        files: files.map(f => f.name),
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">강의 자료 업로드</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="course-name">과정/트랙명</Label>
              <Input
                id="course-name"
                placeholder="과정명을 입력하세요"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment">과제 설명</Label>
              <Textarea
                id="assignment"
                placeholder="과제 내용을 입력하세요"
                rows={5}
                value={assignmentDescription}
                onChange={(e) => setAssignmentDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>강의 자료 (PDF)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-12 h-12 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    클릭하여 PDF 파일을 선택하세요
                  </span>
                  <span className="text-xs text-gray-500">
                    여러 개의 파일을 업로드할 수 있습니다
                  </span>
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">업로드된 파일:</p>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-100 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleUpload}
              className="w-full"
              size="lg"
              disabled={!courseName || files.length === 0}
            >
              업로드
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
