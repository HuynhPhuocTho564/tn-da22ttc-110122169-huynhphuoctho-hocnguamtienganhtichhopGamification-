import Card from "@/components/ui/Card";

export type AdminReportsData = {
  newUsersLast7Days: number;
  completedAttemptsLast7Days: number;
  averageScore: number;
  topExercises: Array<{
    id: string;
    name: string;
    completions: number;
    avgScore: number;
  }>;
};

export default function ReportsAnalytics({ data }: { data: AdminReportsData }) {
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <div className="p-6">
            <dt className="text-sm font-semibold text-slate-600">Người dùng mới 7 ngày</dt>
            <dd className="mt-2 text-3xl font-bold text-slate-900">{data.newUsersLast7Days}</dd>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <dt className="text-sm font-semibold text-slate-600">Bài tập hoàn thành 7 ngày</dt>
            <dd className="mt-2 text-3xl font-bold text-slate-900">{data.completedAttemptsLast7Days}</dd>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <dt className="text-sm font-semibold text-slate-600">Điểm trung bình</dt>
            <dd className="mt-2 text-3xl font-bold text-slate-900">{data.averageScore}%</dd>
          </div>
        </Card>
      </dl>

      <Card>
        <div className="p-6">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Bài tập phổ biến nhất</h2>

          {data.topExercises.length > 0 ? (
            <div className="space-y-4">
              {data.topExercises.map((exercise, index) => (
                <div key={exercise.id} className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{exercise.name}</h3>
                    <p className="text-sm text-slate-600">{exercise.completions} lượt hoàn thành</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{exercise.avgScore}%</div>
                    <div className="text-xs text-slate-600">Điểm TB</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">Chưa có lượt làm bài trong 7 ngày gần đây.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
