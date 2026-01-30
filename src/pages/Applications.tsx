import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { APPLICATION_STATUSES } from '../lib/constants';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { 
  Briefcase, MapPin, ExternalLink, ChevronDown, ChevronUp,
  Clock, CheckCircle, Star, Send, XCircle
} from 'lucide-react';

interface Application {
  id: string;
  job_id: string;
  status: keyof typeof APPLICATION_STATUSES;
  applied_date: string | null;
  callback_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  job: {
    title: string;
    company: string;
    location: string;
    salary_min: number | null;
    salary_max: number | null;
    score: number;
    external_url?: string;
    portal: { display_name: string };
  };
}

const STATUS_ICONS: Record<string, any> = {
  interested: Star,
  applied: Send,
  interviewing: Clock,
  offered: CheckCircle,
  rejected: XCircle,
};

export function Applications() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [editingStatus, setEditingStatus] = useState<keyof typeof APPLICATION_STATUSES>('interested');

  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile]);

  useEffect(() => {
    if (profile && expandedStatus) {
      fetchApplications(true);
    } else {
      setApplications([]);
    }
  }, [profile, expandedStatus]);

  const fetchStats = async () => {
    try {
      const data = await api.getUserStats(profile!.id);
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Failed to load stats', 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchApplications(false);
        }
      },
      { threshold: 0.1 }
    );

    const target = document.querySelector('#infinite-scroll-trigger-apps');
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, applications.length]);

  const fetchApplications = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : applications.length;
      const data = await api.getUserApplications(profile!.id, expandedStatus || undefined, LIMIT, offset);
      
      // Transform to match Application interface  
      const transformed = data.map((app: any) => ({
        id: app.id,
        job_id: app.job_id,
        status: app.offer_received ? 'offer' :
                app.rejected ? 'rejected' :
                app.interview_stage ? 'interview' :
                app.callback ? 'callback' :
                app.applied ? 'applied' : 'interested',
        applied_date: app.applied_at ? new Date(app.applied_at).toISOString().split('T')[0] : null,
        callback_date: app.callback_at ? new Date(app.callback_at).toISOString().split('T')[0] : null,
        notes: app.notes || '',
        created_at: app.created_at || new Date().toISOString(),
        updated_at: app.created_at || new Date().toISOString(),
        job: {
          title: app.job_title,
          company: app.company,
          location: app.location || 'Remote',
          salary_min: null,
          salary_max: null,
          score: app.skill_match_score || 0,
          external_url: app.job_link,
          portal: { display_name: app.platform || 'Unknown' }
        }
      }));
      
      if (reset) {
        setApplications(transformed);
      } else {
        setApplications(prev => [...prev, ...transformed]);
      }

      if (data.length < LIMIT) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      showToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const markAsApplied = async (appId: string) => {
    try {
      await api.markAsApplied(appId);
      
      setApplications(prev => 
        prev.map((app) =>
          app.id === appId 
            ? { 
                ...app, 
                status: 'applied',
                applied_date: new Date().toISOString().split('T')[0]
              } 
            : app
        )
      );
      
      showToast('Marked as applied!', 'success');
    } catch (error) {
      console.error('Error marking as applied:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const updateApplication = async (appId: string, status: keyof typeof APPLICATION_STATUSES, notes: string) => {
    try {
      // Map frontend status back to DB booleans
      const updates: any = {
          notes,
          applied: ['applied', 'callback', 'interview', 'offer'].includes(status),
          callback: ['callback', 'interview', 'offer'].includes(status),
          interview_stage: status === 'interview' ? 'Initial' : (status === 'offer' ? 'Offered' : null),
          offer_received: status === 'offer',
          rejected: status === 'rejected'
      };

      await api.updateApplication(appId, updates);

      setApplications(prev =>
        prev.map((app) => (app.id === appId ? { ...app, status, notes } : app))
      );

      // Refresh stats
      fetchStats();

      showToast('Application updated', 'success');
      setSelectedApp(null);
    } catch (error) {
      console.error('Error updating application:', error);
      showToast('Failed to update application', 'error');
    }
  };

  const getApplicationsByStatus = (_status: keyof typeof APPLICATION_STATUSES) => {
    return applications; // Since we filter by status in the API now
  };

  const toggleExpand = (status: string) => {
    setExpandedStatus(expandedStatus === status ? null : status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Application Tracker</h1>
        <p className="text-gray-400 mt-1">
          Track and manage your job applications ({applications.length} total)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(APPLICATION_STATUSES).map(([status, config]) => {
          const count = stats ? (
            status === 'interested' ? stats.interested_count :
            status === 'applied' ? stats.applied_count :
            status === 'callback' ? stats.callback_count :
            status === 'interview' ? stats.interview_count :
            status === 'offer' ? stats.offer_count :
            status === 'rejected' ? stats.rejected_count : 0
          ) : 0;
          const Icon = STATUS_ICONS[status] || Briefcase;
          const isExpanded = expandedStatus === status;
          
          const colorClasses: Record<string, string> = {
            gray: 'from-gray-600/20 to-gray-700/10 border-gray-600/30 hover:border-gray-500/50',
            blue: 'from-blue-600/20 to-blue-700/10 border-blue-600/30 hover:border-blue-500/50',
            yellow: 'from-yellow-600/20 to-yellow-700/10 border-yellow-600/30 hover:border-yellow-500/50',
            purple: 'from-purple-600/20 to-purple-700/10 border-purple-600/30 hover:border-purple-500/50',
            green: 'from-green-600/20 to-green-700/10 border-green-600/30 hover:border-green-500/50',
            red: 'from-red-600/20 to-red-700/10 border-red-600/30 hover:border-red-500/50',
          };
          
          return (
            <button
              key={status}
              onClick={() => toggleExpand(status)}
              className={`p-4 rounded-xl border bg-gradient-to-br transition-all cursor-pointer ${
                colorClasses[config.color]
              } ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={20} className="text-gray-300" />
                {isExpanded ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </div>
              <p className="text-3xl font-bold text-white mb-1">{count}</p>
              <p className="text-sm text-gray-400">{config.label}</p>
            </button>
          );
        })}
      </div>

      {/* Expanded List */}
      {expandedStatus && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              {APPLICATION_STATUSES[expandedStatus as keyof typeof APPLICATION_STATUSES].label}
            </h2>
            <button
              onClick={() => setExpandedStatus(null)}
              className="text-gray-400 hover:text-white"
            >
              <XCircle size={20} />
            </button>
          </div>

          {getApplicationsByStatus(expandedStatus as keyof typeof APPLICATION_STATUSES).length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto text-gray-600 mb-4" size={48} />
              <p className="text-gray-400">No applications in this category</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getApplicationsByStatus(expandedStatus as keyof typeof APPLICATION_STATUSES).map((app) => (
                <div
                  key={app.id}
                  className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{app.job.title}</h3>
                      <p className="text-sm text-gray-400">{app.job.company}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {app.job.location}
                        </span>
                        <Badge variant="info">{app.job.portal.display_name}</Badge>
                        <span>{app.job.score}% match</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {app.job.external_url && (
                        <a
                          href={app.job.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                      
                      {app.status === 'interested' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => markAsApplied(app.id)}
                        >
                          ✅ Mark Applied
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app);
                          setEditingNotes(app.notes);
                          setEditingStatus(app.status);
                        }}
                      >
                        Edit Details
                      </Button>
                    </div>
                  </div>
                  
                  {app.applied_date && (
                    <p className="text-xs text-gray-500 mt-2">
                      Applied on: {new Date(app.applied_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
              
              <div id="infinite-scroll-trigger-apps" className="h-10 flex items-center justify-center">
                {loadingMore && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Quick tip when no status expanded */}
      {!expandedStatus && applications.length > 0 && (
        <Card className="p-4 bg-blue-600/10 border-blue-500/30">
          <p className="text-sm text-blue-300">
            💡 Click on any status card above to see the applications in that category.
          </p>
        </Card>
      )}

      {/* Empty state */}
      {applications.length === 0 && (
        <Card className="p-12 text-center">
          <Briefcase className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-bold text-white mb-2">No Applications Yet</h3>
          <p className="text-gray-400">
            Jobs you're interested in will appear here. Click "Apply" on any job in the Job Feed to track it.
          </p>
        </Card>
      )}

      {/* Notes Modal */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title="Application Notes"
          size="md"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{selectedApp.job.title}</h3>
              <p className="text-gray-400">{selectedApp.job.company}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={editingStatus}
                  onChange={(e) => setEditingStatus(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(APPLICATION_STATUSES).map(([val, config]) => (
                    <option key={val} value={val}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add notes about this application (interview dates, contacts, etc.)..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => updateApplication(selectedApp.id, editingStatus, editingNotes)}
              >
                Save Changes
              </Button>
              <Button variant="ghost" onClick={() => setSelectedApp(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
