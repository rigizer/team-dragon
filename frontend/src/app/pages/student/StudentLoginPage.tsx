import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { loginStudent } from '../../api/student';

export function StudentLoginPage() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId.trim()) {
      alert('학번을 입력해주세요');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await loginStudent(studentId.trim());

      if (!response.isSuccess || !response.role) {
        setErrorMessage('로그인에 실패했습니다. 학번을 확인해주세요.');
        localStorage.setItem('studentId', studentId.trim());
        return;
      }

      localStorage.setItem('userId', response.user_id ?? '');
      localStorage.setItem('userRole', 'STUDENT');
      localStorage.setItem('studentId', studentId.trim());

      navigate('/student/tracks');
    } catch {
      setErrorMessage('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      localStorage.setItem('studentId', studentId.trim());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
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
            <CardTitle>학생 로그인</CardTitle>
            <CardDescription>학번을 입력하여 시작하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">학번</Label>
                <Input
                  id="studentId"
                  placeholder="예: 2024001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '로그인 중...' : '시작하기'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
