import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge, ScoreBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Slider } from '../components/ui/Slider';
import { Briefcase, MapPin, DollarSign, ExternalLink, Grid, List, Filter } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string | null;
  requirements: string | null;
  score: number;
  role_stretch: number;
  risk_reward: number;
  recommendation: string;
  ai_analysis: any;
  external_url: string | null;
  created_at: string;
  portal: { display_name: string };
}

export function JobFeed() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 12;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [filters, setFilters] = useState({
    portal: 'all',
    scoreMin: 0,
    dateRange: '7',
  });

  useEffect(() => {
    if (profile) {
      fetchJobs(true);
    }
  }, [profile]);

  useEffect(() => {
    applyFilters();
  }, [filters, jobs]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchJobs(false);
        }
      },
      { threshold: 0.1 }
    );

    const target = document.querySelector('#infinite-scroll-trigger');
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, jobs.length]);

  const fetchJobs = async (reset = false) => {
    if (!profile) return;
    
    try {
      if (reset) {
        setLoading(true);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : jobs.length;
      // Get scored jobs with details from backend API
      const scores = await api.getUserScores(profile.id, undefined, LIMIT, offset);
      
      // Transform to match Job interface
      const jobsData = scores.map((s: any) => ({
        id: s.job_id || s.id,
        title: s.job_title,
        company: s.company,
        location: s.location || 'Remote',
        salary_min: null,
        salary_max: null,
        description: s.job_description,
        requirements: null,
        score: s.skill_match_score || 0,
        role_stretch: s.role_stretch_score || 0,
        risk_reward: s.risk_reward_score || 0,
        recommendation: s.ai_recommendation || 'unknown',
        ai_analysis: { 
          recommendation: s.ai_recommendation, 
          reason: s.reason,
          missing_skills: s.missing_skills || []
        },
        external_url: s.job_link,
        created_at: s.scored_at || new Date().toISOString(),
        portal: { display_name: s.platform || 'Unknown' }
      }));
      
      if (reset) {
        setJobs(jobsData);
      } else {
        setJobs(prev => [...prev, ...jobsData]);
      }

      if (scores.length < LIMIT) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showToast('Failed to load jobs', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    if (filters.portal !== 'all') {
      filtered = filtered.filter((job) => job.portal.display_name === filters.portal);
    }

    filtered = filtered.filter((job) => job.score >= filters.scoreMin);

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(filters.dateRange));
    filtered = filtered.filter((job) => new Date(job.created_at) >= daysAgo);

    setFilteredJobs(filtered);
  };

  const handleApply = async (jobId: string) => {
    try {
      await api.createApplication(profile!.id, jobId, false);
      showToast('Marked as applied!', 'success');
      setSelectedJob(null);
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('EXISTS')) {
        showToast('Already marked as applied', 'warning');
      } else {
        showToast('Failed to mark as applied', 'error');
      }
    }
  };

  const portals = ['all', ...Array.from(new Set(jobs.map((j) => j.portal.display_name)))];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <h2 className="text-lg font-bold text-white">Filters</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Portal"
            value={filters.portal}
            onChange={(e) => setFilters({ ...filters, portal: e.target.value })}
            options={portals.map((p) => ({ value: p, label: p === 'all' ? 'All Portals' : p }))}
          />

          <div>
            <Slider
              label="Minimum Score"
              min={0}
              max={100}
              value={filters.scoreMin}
              onChange={(val) => setFilters({ ...filters, scoreMin: val })}
              unit="%"
            />
          </div>

          <Select
            label="Date Range"
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            options={[
              { value: '1', label: 'Last 24 hours' },
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '365', label: 'All time' },
            ]}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">{filteredJobs.length} jobs found</p>
          <Button variant="ghost" size="sm" onClick={() => setFilters({ portal: 'all', scoreMin: 0, dateRange: '7' })}>
            Reset Filters
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-800/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="p-12 text-center">
          <Briefcase className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">No jobs found</h3>
          <p className="text-gray-400">Try adjusting your filters or check back later</p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <JobListItem key={job.id} job={job} onClick={() => setSelectedJob(job)} />
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      <div id="infinite-scroll-trigger" className="h-20 flex items-center justify-center">
        {loadingMore && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        )}
        {!hasMore && jobs.length > 0 && (
          <p className="text-gray-500 text-sm">No more jobs to load</p>
        )}
      </div>

      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title="Job Details"
          size="lg"
        >
          <JobDetailView job={selectedJob} onApply={handleApply} />
        </Modal>
      )}
    </div>
  );
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case 'auto_apply': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'human_review': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRecommendationLabel = (rec: string) => {
    switch (rec) {
      case 'auto_apply': return '✅ Apply';
      case 'human_review': return '🤔 Review';
      default: return '⏭️ Skip';
    }
  };

  return (
    <Card className="p-5 hover:border-gray-600 transition-all cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
          <Briefcase size={24} className="text-gray-400" />
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRecommendationStyle(job.recommendation)}`}>
          {getRecommendationLabel(job.recommendation)}
        </div>
      </div>

      <h3 className="font-bold text-white mb-1 line-clamp-1">{job.title}</h3>
      <p className="text-sm text-gray-400 mb-3">{job.company}</p>

      {/* Score breakdown */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="text-center p-2 bg-gray-800/50 rounded">
          <div className="text-blue-400 font-bold">{job.score}%</div>
          <div className="text-gray-500">Skill</div>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded">
          <div className="text-purple-400 font-bold">{job.role_stretch}%</div>
          <div className="text-gray-500">Role</div>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded">
          <div className="text-emerald-400 font-bold">{job.risk_reward}%</div>
          <div className="text-gray-500">Fit</div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <MapPin size={14} />
          <span className="line-clamp-1">{job.location || 'Remote'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Badge variant="info">{job.portal.display_name}</Badge>
        <span className="text-xs text-gray-500">
          {new Date(job.created_at).toLocaleDateString()}
        </span>
      </div>
    </Card>
  );
}

function JobListItem({ job, onClick }: { job: Job; onClick: () => void }) {
  return (
    <Card className="p-5 hover:border-gray-600 transition-all cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
          <Briefcase size={24} className="text-gray-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-white line-clamp-1">{job.title}</h3>
              <p className="text-sm text-gray-400">{job.company}</p>
            </div>
            <ScoreBadge score={job.score} />
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{job.location || 'Remote'}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign size={14} />
              <span>{formatSalary(job.salary_min, job.salary_max)}</span>
            </div>
            <Badge variant="info">{job.portal.display_name}</Badge>
          </div>
        </div>

        <span className="text-xs text-gray-500">
          {new Date(job.created_at).toLocaleDateString()}
        </span>
      </div>
    </Card>
  );
}

function JobDetailView({ job, onApply }: { job: Job; onApply: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{job.title}</h2>
            <p className="text-lg text-gray-300">{job.company}</p>
          </div>
          <ScoreBadge score={job.score} className="text-lg px-4 py-2" />
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>{job.location || 'Remote'}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={16} />
            <span>{formatSalary(job.salary_min, job.salary_max)}</span>
          </div>
          <Badge variant="info">{job.portal.display_name}</Badge>
        </div>
      </div>

      {job.description && (
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Description</h3>
          <p className="text-gray-300 whitespace-pre-wrap">{job.description}</p>
        </div>
      )}

      {job.requirements && (
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Requirements</h3>
          <p className="text-gray-300 whitespace-pre-wrap">{job.requirements}</p>
        </div>
      )}

      {job.ai_analysis && Object.keys(job.ai_analysis).length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-2">AI Analysis</h3>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(job.ai_analysis, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="primary" className="flex-1" onClick={() => onApply(job.id)}>
          Mark as Applied
        </Button>
        {job.external_url && (
          <Button
            variant="secondary"
            onClick={() => window.open(job.external_url!, '_blank')}
          >
            <ExternalLink size={18} />
          </Button>
        )}
      </div>
    </div>
  );
}

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return 'Not specified';
  const formatLPA = (val: number) => `₹${(val / 100000).toFixed(1)}L`;
  if (min && max) return `${formatLPA(min)} - ${formatLPA(max)}`;
  if (min) return `${formatLPA(min)}+`;
  return `Up to ${formatLPA(max!)}`;
}
