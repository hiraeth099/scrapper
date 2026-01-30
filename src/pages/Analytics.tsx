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
      const scores = await api.getUserScores(profile!.id);
      const applications = await api.getUserApplications(profile!.id, false);

      // Filter by time range
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
      
      const filteredScores = scores.filter((s: any) => new Date(s.scored_at) >= daysAgo);
      const filteredApps = applications.filter((a: any) => new Date(a.created_at) >= daysAgo);

      // Calculate stats
      const jobsByPlatform: Record<string, number> = {};
      const jobsByScore = { '0-59': 0, '60-79': 0, '80-100': 0 };
      let totalScore = 0;

      filteredScores.forEach((score: any) => {
        const platform = score.platform|| 'Unknown';
        jobsByPlatform[platform] = (jobsByPlatform[platform] || 0) + 1;

        const matchScore = score.skill_match_score || 0;
        if (matchScore < 60) jobsByScore['0-59']++;
        else if (matchScore < 80) jobsByScore['60-79']++;
        else jobsByScore['80-100']++;

        totalScore += matchScore;
      });

      const topPlatform = Object.entries(jobsByPlatform).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

      setStats({
        totalJobs: filteredScores.length,
        totalApplications: filteredApps.length,
        averageScore: filteredScores.length ? Math.round(totalScore / filteredScores.length) : 0,
        conversionRate: filteredScores.length ? Math.round((filteredApps.length / filteredScores.length) * 100) : 0,
        topPlatform,
      });

      setChartData({
        jobsByPlatform,
        jobsByScore,
        applicationFunnel: {
          scraped: filteredScores.length,
          matched: filteredScores.filter((s: any) => (s.skill_match_score || 0) >= 60).length,
          applied: filteredApps.filter((a: any) => a.applied).length,
          callback: filteredApps.filter((a: any) => a.callback).length,
        },
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
