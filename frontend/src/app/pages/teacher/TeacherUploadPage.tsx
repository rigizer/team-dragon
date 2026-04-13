import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { ArrowLeft, Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

export function TeacherUploadPage() {
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseName.trim()) {
      toast.error("과정/트랙명을 입력해주세요.");
      return;
    }

    if (files.length === 0) {
      toast.error("최소 1개 이상의 PDF 파일을 업로드해주세요.");
      return;
    }

    toast.success("파일 업로드 완료! 루브릭을 생성합니다...");

    // Mock API call
    // const formData = new FormData();
    // formData.append('courseName', courseName);
    // formData.append('assignmentDesc', assignmentDesc);
    // files.forEach(file => formData.append('files', file));
    // await fetch('/api/teacher/upload', { method: 'POST', body: formData });

    // Navigate to criteria page with data
    navigate('/teacher/criteria', {
      state: {
        courseName,
        assignmentDesc,
        files: files.map(f => f.name),
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          처음으로
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>강의 자료 업로드</CardTitle>
            <CardDescription>한 과제에 대한 강의 자료를 업로드하면 자동으로 평가 항목을 추출합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="courseName">과정/트랙명 *</Label>
                <Input
                  id="courseName"
                  placeholder="예: 웹 개발 기초, Python 프로그래밍"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignmentDesc">과제 설명</Label>
                <Textarea
                  id="assignmentDesc"
                  placeholder="과제에 대한 설명을 입력하세요 (선택사항)"
                  rows={4}
                  value={assignmentDesc}
                  onChange={(e) => setAssignmentDesc(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>강의 자료 (PDF) *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="fileInput"
                    multiple
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="fileInput"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-12 h-12 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      클릭하여 PDF 파일 선택 (다중 업로드 가능)
                    </span>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">
                      선택된 파일 ({files.length}개)
                    </p>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-red-500" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
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
                type="submit"
                className="w-full"
                disabled={!courseName.trim() || files.length === 0}
              >
                <Upload className="mr-2 h-4 w-4" />
                업로드하고 평가 기준 확인하기
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
