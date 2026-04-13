import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { API_ENDPOINTS } from '../config/api';

type LoginResponse = {
  isSuccess: boolean;
  user_id: string | null;
  name: string | null;
  role: string | null;
};

export function HomePage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 이전 홈 화면 UI (요청사항에 따라 삭제하지 않고 주석으로 보존)
  // return (
  //   <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
  //     <div className="w-full max-w-4xl">
  //       <div className="text-center mb-12">
  //         <h1 className="text-4xl mb-4">취업 포트폴리오 관리</h1>
  //         <p className="text-slate-600">강사와 학생이 함께 만드는 취업 준비 시스템</p>
  //       </div>

  //       <div className="grid md:grid-cols-2 gap-6">
  //         <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/teacher/tracks')}>
  //           <CardHeader>
  //             <CardTitle className="text-2xl">강사 모드</CardTitle>
  //             <CardDescription>트랙 생성 및 학생 평가 관리</CardDescription>
  //           </CardHeader>
  //           <CardContent>
  //             <ul className="space-y-2 text-sm text-slate-600">
  //               <li>• 교육 트랙 생성 및 관리</li>
  //               <li>• AI 자동 평가지표 생성</li>
  //               <li>• 학생 포트폴리오 검토</li>
  //               <li>• 학생별 역량 평가</li>
  //             </ul>
  //             <Button className="w-full mt-6">강사로 시작하기</Button>
  //           </CardContent>
  //         </Card>

  //         <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/student/tracks')}>
  //           <CardHeader>
  //             <CardTitle className="text-2xl">학생 모드</CardTitle>
  //             <CardDescription>포트폴리오 업로드 및 역량 평가</CardDescription>
  //           </CardHeader>
  //           <CardContent>
  //             <ul className="space-y-2 text-sm text-slate-600">
  //               <li>• 수강 트랙 확인</li>
  //               <li>• 발표자료 업로드</li>
  //               <li>• AI 역량 분석 및 선택</li>
  //               <li>• 개인 기여도 평가</li>
  //             </ul>
  //             <Button className="w-full mt-6">학생으로 시작하기</Button>
  //           </CardContent>
  //         </Card>
  //       </div>
  //     </div>
  //   </div>
  // );

  const handleLogin = async (e: any) => {
    e.preventDefault();

    if (!loginId.trim()) {
      setErrorMessage('아이디를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login_id: loginId.trim() }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!data.isSuccess || !data.role) {
        setErrorMessage('로그인에 실패했습니다. 아이디를 확인해주세요.');
        return;
      }

      localStorage.setItem('userId', data.user_id ?? '');
      localStorage.setItem('userName', data.name ?? '');
      localStorage.setItem('userRole', data.role);

      if (data.role === 'INSTRUCTOR' || data.role === 'TEACHER') {
        navigate('/teacher/tracks');
        return;
      }

      if (data.role === 'STUDENT') {
        navigate('/student/tracks');
        return;
      }

      setErrorMessage(`알 수 없는 권한입니다: ${data.role}`);
    } catch {
      setErrorMessage('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">근거 기반 취업 제출 패킷</CardTitle>
            <CardDescription>교육 결과물을 재조립해 강사 기준과 학생 기여를 연결하고, 관련 직무를 제안합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-id">아이디</Label>
                <Input
                  id="login-id"
                  placeholder="예: 0001"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}


              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
