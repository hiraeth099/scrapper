import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SLOTS } from '../lib/constants';
import { Card } from '../components/ui/Card';
import { Badge, ScoreBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TrendingUp, Briefcase, Star, CheckSquare, Clock } from 'lucide-react';

interface Stats {
  jobsScrapedToday: number;
  topMatches: number;
  pendingReview: number;
  appliedThisWeek: number;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  score: number;
  portal: string;
  created_at: string;
}

export function DashboardHome() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    jobsScrapedToday: 0,
    topMatches: 0,
    pendingReview: 0,
    appliedThisWeek: 0,
  });
  const [topJobs, setTopJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats and top jobs in parallel
      const [statsData, topJobsData] = await Promise.all([
        api.getDashboardStats(profile!.id),
        api.getDashboardTopJobs(profile!.id)
      ]);

      setStats({
        jobsScrapedToday: statsData.jobsScrapedToday || 0,
        topMatches: statsData.topMatches || 0,
        pendingReview: statsData.pendingReview || 0,
        appliedThisWeek: statsData.appliedThisWeek || 0,
      });

      // Map API response to UI job format
      const formattedJobs = topJobsData.map((job: any) => ({
        id: job.job_id || job.id,
        title: job.job_title,
        company: job.company,
        location: 'Remote', // Default or fetch if available
        score: job.overall_score || 0,
        portal: job.platform || 'Unknown',
        created_at: new Date().toISOString() // Or job.created_at
      }));

      setTopJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  const slot = SLOTS[profile.assigned_slot];
  const now = new Date();
  const nextRun = new Date();
  
  // Parse time properly with AM/PM
  const [timePart, period] = slot.time.split(' ');
  let [hour, minute] = timePart.split(':').map(Number);
  
  if (period === 'PM' && hour !== 12) hour += 12;
  else if (period === 'AM' && hour === 12) hour = 0;
  
  nextRun.setHours(hour, minute || 0, 0, 0);
  if (nextRun < now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  const diffMs = nextRun.getTime() - now.getTime();
  const hoursUntilRun = Math.floor(diffMs / (1000 * 60 * 60));
  const minutesUntilRun = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="space-y-6">
      <Card className="p-6" glow>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome back, {profile.name}!
            </h1>
            <p className="text-gray-400">
              Your next scraping run is scheduled for {slot.label} ({slot.time})
            </p>
          </div>
          <div className="text-center px-6 py-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30">
            <div className="text-4xl mb-1">{slot.icon}</div>
            <p className="text-sm text-gray-400">Next run in</p>
            <p className="text-2xl font-bold text-white">
              {hoursUntilRun}h {minutesUntilRun}m
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Briefcase />}
          label="Jobs Scraped Today"
          value={stats.jobsScrapedToday}
          color="blue"
        />
        <StatCard
          icon={<Star />}
          label="Top Matches (>80%)"
          value={stats.topMatches}
          color="green"
        />
        <StatCard
          icon={<Clock />}
          label="Pending Review"
          value={stats.pendingReview}
          color="yellow"
        />
        <StatCard
          icon={<CheckSquare />}
          label="Applied This Week"
          value={stats.appliedThisWeek}
          color="purple"
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Today's Top Matches</h2>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-800/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : topJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400">No jobs scraped yet today</p>
            <p className="text-sm text-gray-500 mt-2">
              Check back after your next scheduled run at {slot.time}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-4 p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-gray-700"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                  <Briefcase size={24} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">{job.title}</h3>
                  <p className="text-sm text-gray-400">
                    {job.company} • {job.location}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="info">{job.portal}</Badge>
                  <ScoreBadge score={job.score} />
                  <Button variant="primary" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Slot Status</h2>
          <div className="space-y-3">
            {Object.entries(SLOTS).map(([key, slotInfo]) => (
              <div
                key={key}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  key === profile.assigned_slot
                    ? 'bg-blue-600/20 border border-blue-500/30'
                    : 'bg-gray-800/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{slotInfo.icon}</span>
                  <div>
                    <p className="font-medium text-white">{slotInfo.label}</p>
                    <p className="text-sm text-gray-400">{slotInfo.time}</p>
                  </div>
                </div>
                {key === profile.assigned_slot && (
                  <Badge variant="info">Your Slot</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <ActivityItem
              icon={<Briefcase size={16} />}
              text="15 new jobs scraped"
              time="2 hours ago"
            />
            <ActivityItem
              icon={<Star size={16} />}
              text="3 high-score matches found"
              time="2 hours ago"
            />
            <ActivityItem
              icon={<CheckSquare size={16} />}
              text="Applied to Senior DevOps Engineer"
              time="5 hours ago"
            />
            <ActivityItem
              icon={<TrendingUp size={16} />}
              text="Application status updated"
              time="1 day ago"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'from-blue-600/20 to-blue-500/10 border-blue-500/30',
    green: 'from-green-600/20 to-green-500/10 border-green-500/30',
    yellow: 'from-yellow-600/20 to-yellow-500/10 border-yellow-500/30',
    purple: 'from-purple-600/20 to-purple-500/10 border-purple-500/30',
  };

  return (
    <Card className={`p-6 bg-gradient-to-br ${colors[color]} border`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-white">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </Card>
  );
}

function ActivityItem({ icon, text, time }: { icon: React.ReactNode; text: string; time: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-white">{text}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}
