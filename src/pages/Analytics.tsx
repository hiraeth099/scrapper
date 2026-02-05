import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { TrendingUp, Briefcase, Target, Award } from 'lucide-react';

interface Stats {
  totalJobs: number;
  totalApplications: number;
  averageScore: number;
  conversionRate: number;
  topPlatform: string;
}

interface ChartData {
  jobsByPlatform: Record<string, number>;
  jobsByScore: Record<string, number>;
  applicationFunnel: Record<string, number>;
}

export function Analytics() {
  const { profile } = useAuth();
  const [timeRange, setTimeRange] = useState('30');
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    totalApplications: 0,
    averageScore: 0,
    conversionRate: 0,
    topPlatform: 'N/A',
  });
  const [chartData, setChartData] = useState<ChartData>({
    jobsByPlatform: {},
    jobsByScore: { '0-59': 0, '60-79': 0, '80-100': 0 },
    applicationFunnel: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchAnalytics();
    }
  }, [profile, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getUserAnalytics(profile!.id, parseInt(timeRange));

      // Update summary stats
      const totalApps = data.funnel?.applied || 0;
      
      // Calculate weighted average score roughly from distribution if not provided
      let totalScoreSum = 0;
      let totalScoreCount = 0;
      Object.entries(data.jobs_by_score || {}).forEach(([range, count]) => {
        const c = count as number;
        if (range === '0-59') totalScoreSum += c * 30;
        else if (range === '60-79') totalScoreSum += c * 70;
        else if (range === '80-100') totalScoreSum += c * 90;
        totalScoreCount += c;
      });
      const averageScore = totalScoreCount ? Math.round(totalScoreSum / totalScoreCount) : 0;

      // Find top platform
      let topPlatform = 'N/A';
      let maxCount = 0;
      Object.entries(data.jobs_by_platform || {}).forEach(([p, c]) => {
        if ((c as number) > maxCount) {
          maxCount = c as number;
          topPlatform = p;
        }
      });

      setStats({
        totalJobs: data.funnel?.scraped || 0,
        totalApplications: totalApps,
        averageScore,
        conversionRate: data.funnel?.scraped ? Math.round((totalApps / data.funnel.scraped) * 100) : 0,
        topPlatform,
      });

      setChartData({
        jobsByPlatform: data.jobs_by_platform || {},
        jobsByScore: data.jobs_by_score || { '0-59': 0, '60-79': 0, '80-100': 0 },
        applicationFunnel: data.funnel || {}
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Insights</h1>
          <p className="text-gray-400 mt-1">Track your job search performance</p>
        </div>

        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          options={[
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
            { value: '90', label: 'Last 90 days' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Briefcase />} label="Total Jobs Scored" value={stats.totalJobs} color="blue" />
        <MetricCard icon={<Target />} label="Applications" value={stats.totalApplications} color="green" />
        <MetricCard icon={<Award />} label="Avg. Score" value={`${stats.averageScore}%`} color="purple" />
        <MetricCard icon={<TrendingUp />} label="Conversion" value={`${stats.conversionRate}%`} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Jobs by Platform</h2>
          <div className="space-y-3">
            {Object.entries(chartData.jobsByPlatform).map(([platform, count]) => (
              <div key={platform} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-400">{platform}</div>
                <div className="flex-1 h-8 bg-gray-800 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-end pr-3 text-sm font-medium text-white"
                    style={{ width: `${(count / stats.totalJobs) * 100}%`, minWidth: '2rem' }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Score Distribution</h2>
          <div className="space-y-3">
            {Object.entries(chartData.jobsByScore).map(([range, count]) => {
              const colors = {
                '0-59': 'from-red-600 to-red-500',
                '60-79': 'from-yellow-600 to-yellow-500',
                '80-100': 'from-green-600 to-green-500',
              };
              return (
                <div key={range} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-400">{range}%</div>
                  <div className="flex-1 h-8 bg-gray-800 rounded-lg overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors[range as keyof typeof colors]} flex items-center justify-end pr-3 text-sm font-medium text-white`}
                      style={{ width: `${stats.totalJobs ? (count / stats.totalJobs) * 100 : 0}%`, minWidth: '2rem' }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-600/20 to-blue-500/10 border-blue-500/30',
    green: 'from-green-600/20 to-green-500/10 border-green-500/30',
    yellow: 'from-yellow-600/20 to-yellow-500/10 border-yellow-500/30',
    purple: 'from-purple-600/20 to-purple-500/10 border-purple-500/30',
  };

  return (
    <Card className={`p-6 bg-gradient-to-br ${colors[color]} border`}>
      <div className="text-white mb-4">{icon}</div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </Card>
  );
}
