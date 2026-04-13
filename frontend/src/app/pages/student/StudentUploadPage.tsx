import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Upload } from 'lucide-react';
import { FileDropzone } from '../../components/FileDropzone';

export function StudentUploadPage() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [mainLink, setMainLink] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [presentationLink, setPresentationLink] = useState('');
  const [deployLink, setDeployLink] = useState('');

  useEffect(() => {
    const savedStudentId = localStorage.getItem('studentId');
    if (!savedStudentId) {
      navigate('/student/login');
      return;
    }
    setStudentId(savedStudentId);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (projectFiles.length === 0) {
      alert('프로젝트 자료를 업로드해주세요');
      return;
    }

    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('projectName', projectName);

    projectFiles.forEach(file => {
      formData.append('projectFile', file);
    });

    formData.append('mainLink', mainLink);
    formData.append('githubLink', githubLink);
    formData.append('presentationLink', presentationLink);
    formData.append('deployLink', deployLink);

    // TODO: API 호출
    console.log('프로젝트 업로드:', {
      studentId,
      projectName,
      projectFiles,
      mainLink,
      githubLink,
      presentationLink,
      deployLink
    });

    navigate('/student/contribution');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/student/login')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            이전으로
          </Button>
          <div className="text-sm text-slate-600">
            학번: <span className="font-medium">{studentId}</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>프로젝트 자료 업로드</CardTitle>
            <CardDescription>
              프로젝트 결과물과 관련 링크를 업로드하면 자동으로 기여도를 분석합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">프로젝트명</Label>
                <Input
                  id="projectName"
                  placeholder="예: 온라인 쇼핑몰 프로젝트"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>

              <FileDropzone
                label="프로젝트 자료 (PDF)"
                description="프로젝트 보고서, 발표 자료 등을 PDF로 업로드하세요"
                accept=".pdf"
                multiple={false}
                maxFiles={1}
                onFilesSelected={setProjectFiles}
              />

              <div className="space-y-2">
                <Label htmlFor="mainLink">대표 링크</Label>
                <Input
                  id="mainLink"
                  type="url"
                  placeholder="https://..."
                  value={mainLink}
                  onChange={(e) => setMainLink(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium">추가 링크 (선택)</p>

                <div className="space-y-2">
                  <Label htmlFor="githubLink">GitHub 저장소</Label>
                  <Input
                    id="githubLink"
                    type="url"
                    placeholder="https://github.com/..."
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="presentationLink">발표 자료</Label>
                  <Input
                    id="presentationLink"
                    type="url"
                    placeholder="https://..."
                    value={presentationLink}
                    onChange={(e) => setPresentationLink(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deployLink">배포 주소</Label>
                  <Input
                    id="deployLink"
                    type="url"
                    placeholder="https://..."
                    value={deployLink}
                    onChange={(e) => setDeployLink(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                업로드하고 기여도 확인하기
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
