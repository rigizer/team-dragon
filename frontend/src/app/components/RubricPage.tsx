import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Plus, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
}

interface Criterion {
  id: string;
  name: string;
  description: string;
}

interface Score {
  criterionId: string;
  studentId: string;
  value: string; // "-" | "1" | "2" | "3" | "4" | "5"
}

export default function RubricPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseName, assignmentDescription, files } = location.state || {};

  // Mock students
  const [students] = useState<Student[]>([
    { id: "s1", name: "김철수" },
    { id: "s2", name: "이영희" },
    { id: "s3", name: "박민수" },
  ]);

  // Mock auto-generated criteria from backend analysis
  const [criteria, setCriteria] = useState<Criterion[]>([
    {
      id: "c1",
      name: "코드 구조",
      description: "코드의 구조화 및 모듈화 수준",
    },
    {
      id: "c2",
      name: "알고리즘 이해도",
      description: "문제 해결을 위한 알고리즘 적용 능력",
    },
    {
      id: "c3",
      name: "문서화",
      description: "코드 주석 및 README 작성 수준",
    },
    {
      id: "c4",
      name: "테스트 커버리지",
      description: "단위 테스트 및 통합 테스트 완성도",
    },
  ]);

  const [scores, setScores] = useState<Score[]>([]);
  const [newCriterionName, setNewCriterionName] = useState("");
  const [isAddingCriterion, setIsAddingCriterion] = useState(false);

  const getScore = (criterionId: string, studentId: string): string => {
    const score = scores.find(
      (s) => s.criterionId === criterionId && s.studentId === studentId
    );
    return score?.value || "-";
  };

  const setScore = (criterionId: string, studentId: string, value: string) => {
    setScores((prev) => {
      const existing = prev.find(
        (s) => s.criterionId === criterionId && s.studentId === studentId
      );
      if (existing) {
        return prev.map((s) =>
          s.criterionId === criterionId && s.studentId === studentId
            ? { ...s, value }
            : s
        );
      }
      return [...prev, { criterionId, studentId, value }];
    });
  };

  const addCriterion = () => {
    if (!newCriterionName.trim()) return;

    const newCriterion: Criterion = {
      id: `c${criteria.length + 1}`,
      name: newCriterionName,
      description: "",
    };
    setCriteria([...criteria, newCriterion]);
    setNewCriterionName("");
    setIsAddingCriterion(false);
  };

  const handleSave = async () => {
    // Mock API call to save rubric data
    // const data = {
    //   courseName,
    //   assignmentDescription,
    //   files,
    //   criteria,
    //   scores,
    // };
    // await fetch('/api/rubric/save', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // });

    toast.success("평가표가 저장되었습니다!");
  };

  if (!courseName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6">
          <p>업로드 페이지에서 먼저 과정 정보를 입력해주세요.</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            업로드 페이지로 이동
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로 가기
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            저장
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{courseName}</CardTitle>
            {assignmentDescription && (
              <p className="text-sm text-gray-600 mt-2">
                {assignmentDescription}
              </p>
            )}
            {files && files.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                분석된 파일: {files.join(", ")}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                백엔드 분석을 통해 자동 생성된 루브릭 평가표입니다.
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-max">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left p-4 bg-gray-100 font-semibold min-w-[200px]">
                        평가 요소
                      </th>
                      {students.map((student) => (
                        <th
                          key={student.id}
                          className="text-center p-4 bg-gray-100 font-semibold min-w-[120px]"
                        >
                          {student.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((criterion, index) => (
                      <tr key={criterion.id} className="border-b border-gray-200">
                        <td className="p-4 bg-gray-50">
                          <div>
                            <div className="font-medium">{criterion.name}</div>
                            {criterion.description && (
                              <div className="text-xs text-gray-600 mt-1">
                                {criterion.description}
                              </div>
                            )}
                          </div>
                        </td>
                        {students.map((student) => (
                          <td key={student.id} className="p-4 text-center">
                            <Select
                              value={getScore(criterion.id, student.id)}
                              onValueChange={(value) =>
                                setScore(criterion.id, student.id, value)
                              }
                            >
                              <SelectTrigger className="w-[100px] mx-auto">
                                <SelectValue placeholder="-" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="-">-</SelectItem>
                                <SelectItem value="1">1점</SelectItem>
                                <SelectItem value="2">2점</SelectItem>
                                <SelectItem value="3">3점</SelectItem>
                                <SelectItem value="4">4점</SelectItem>
                                <SelectItem value="5">5점</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        ))}
                      </tr>
                    ))}
                    {isAddingCriterion && (
                      <tr className="border-b border-gray-200 bg-blue-50">
                        <td className="p-4">
                          <Input
                            placeholder="평가 요소 이름을 입력하세요"
                            value={newCriterionName}
                            onChange={(e) => setNewCriterionName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addCriterion();
                              if (e.key === "Escape") {
                                setIsAddingCriterion(false);
                                setNewCriterionName("");
                              }
                            }}
                            autoFocus
                          />
                        </td>
                        {students.map((student) => (
                          <td key={student.id} className="p-4 text-center">
                            <div className="w-[100px] h-10 mx-auto bg-gray-200 rounded" />
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="mt-4">
                  {isAddingCriterion ? (
                    <div className="flex gap-2">
                      <Button onClick={addCriterion} size="sm">
                        추가
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddingCriterion(false);
                          setNewCriterionName("");
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingCriterion(true)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      평가 요소 추가
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">평가 요약</h3>
              <div className="grid grid-cols-3 gap-4">
                {students.map((student) => {
                  const studentScores = scores.filter(
                    (s) => s.studentId === student.id && s.value !== "-"
                  );
                  const total = studentScores.reduce(
                    (sum, s) => sum + parseInt(s.value),
                    0
                  );
                  const count = studentScores.length;
                  const average = count > 0 ? (total / count).toFixed(1) : "-";

                  return (
                    <div key={student.id} className="p-3 bg-white rounded shadow-sm">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        평균: {average}점 ({count}/{criteria.length} 평가 완료)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
