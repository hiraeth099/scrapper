import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import { useToast } from '../components/ui/Toast';
import { Info, AlertCircle, CheckCircle, Settings, Save, Shield } from 'lucide-react';

interface Portal {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  status?: string;
}

interface UserPortalSetting {
  id: string;
  portal_id: string;
  is_enabled: boolean;
  priority: number;
  portal_config?: any;
}

const PORTAL_ICONS: Record<string, string> = {
  linkedin: '💼',
  remoteok: '🌐',
  remotive: '🚀',
  naukri: '📋',
  indeed: '🔍',
  instahyre: '🌟',
  wellfound: '⚡',
  cutshort: '✂️',
  internshala: '🎓',
  himalayas: '🏔️',
  weworkremotely: '🏠',
};

export function PortalSelection() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [userSettings, setUserSettings] = useState<UserPortalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPortal, setExpandedPortal] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      fetchPortals();
    }
  }, [profile]);

  const fetchPortals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all portals (including inactive ones for display)
      const portalsData = await api.getPortals();
      setPortals(portalsData || []);
      
      // Fetch user settings - handle gracefully if fails
      try {
        const settingsData = await api.getUserPortals(profile!.id);
        setUserSettings(settingsData || []);
        
        // Initialize API keys from config
        const keys: Record<string, string> = {};
        settingsData?.forEach((s: UserPortalSetting) => {
          if (s.portal_config?.scraperapi_key) {
            keys[s.portal_id] = s.portal_config.scraperapi_key;
          }
        });
        setApiKeys(keys);
      } catch (settingsError) {
        console.log('No user portal settings found, initializing...');
        setUserSettings([]);
        
        // Initialize settings for each portal
        if (portalsData && portalsData.length > 0) {
          for (const portal of portalsData) {
            try {
              await api.updateUserPortal(profile!.id, portal.id, {
                is_enabled: portal.is_active,
                priority: portalsData.indexOf(portal) + 1,
              });
            } catch (e) {
              console.log(`Failed to init portal ${portal.id}`);
            }
          }
          // Retry fetching settings
          const updatedSettings = await api.getUserPortals(profile!.id);
          setUserSettings(updatedSettings || []);
        }
      }
    } catch (error) {
      console.error('Error fetching portals:', error);
      setError('Failed to load portal data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (portalId: string, enabled: boolean) => {
    // Store original state for potential rollback
    const originalSettings = [...userSettings];

    // Optimistically update UI
    setUserSettings((prev) => {
      const exists = prev.some((s) => s.portal_id === portalId);
      if (exists) {
        return prev.map((s) => (s.portal_id === portalId ? { ...s, is_enabled: enabled } : s));
      } else {
        return [
          ...prev,
          {
            id: `temp-${portalId}`,
            portal_id: portalId,
            is_enabled: enabled,
            priority: 1,
          },
        ];
      }
    });

    try {
      const updatedSetting = await api.updateUserPortal(profile!.id, portalId, { is_enabled: enabled });
      
      // Update with confirmed data from server
      setUserSettings((prev) =>
        prev.map((s) =>
          s.portal_id === portalId
            ? {
                ...s,
                id: updatedSetting.id,
                is_enabled: updatedSetting.is_enabled,
                priority: updatedSetting.priority,
              }
            : s
        )
      );

      showToast(`${portalId} ${enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      // Revert to original state on failure
      setUserSettings(originalSettings);
      console.error('Error updating portal setting:', error);
      showToast('Failed to update portal setting', 'error');
    }
  };

  const handlePriorityChange = async (portalId: string, priority: number) => {
    const originalSettings = [...userSettings];

    // Optimistically update UI
    setUserSettings((prev) =>
      prev.map((s) => (s.portal_id === portalId ? { ...s, priority } : s))
    );

    try {
      const updatedSetting = await api.updateUserPortal(profile!.id, portalId, { priority });
      
      setUserSettings((prev) =>
        prev.map((s) =>
          s.portal_id === portalId
            ? { ...s, id: updatedSetting.id, priority: updatedSetting.priority }
            : s
        )
      );

      showToast('Priority updated', 'success');
    } catch (error) {
      setUserSettings(originalSettings);
      console.error('Error updating priority:', error);
      showToast('Failed to update priority', 'error');
    }
  };

  const handleConfigUpdate = async (portalId: string) => {
    const key = apiKeys[portalId];
    try {
      const currentSetting = getPortalSetting(portalId);
      const updatedSetting = await api.updateUserPortal(profile!.id, portalId, {
        portal_config: { ...currentSetting.portal_config, scraperapi_key: key }
      });

      setUserSettings(prev => prev.map(s => 
        s.portal_id === portalId ? { ...s, portal_config: updatedSetting.portal_config } : s
      ));

      showToast(`${portalId} configuration saved`, 'success');
      setExpandedPortal(null);
    }
  };

  const handleTestKey = async (portalId: string) => {
    const key = apiKeys[portalId];
    if (!key) {
      showToast('Please enter an API key first', 'error');
      return;
    }

    try {
      setTestingKey(portalId);
      const result = await api.testProxy(key);
      if (result.success) {
        showToast('Connection successful! Proxy is working.', 'success');
      }
    } catch (error: any) {
      showToast(error.message || 'Connection failed', 'error');
    } finally {
      setTestingKey(null);
    }
  };

  const getPortalSetting = (portalId: string) => {
    return userSettings.find(s => s.portal_id === portalId) || {
      id: portalId,
      portal_id: portalId,
      is_enabled: false,
      priority: 99
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-600/10 border-red-500/30">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-400" size={24} />
          <div>
            <h3 className="font-medium text-white">{error}</h3>
            <button 
              onClick={fetchPortals}
              className="text-blue-400 underline mt-2 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-blue-600/10 border-blue-500/30">
        <div className="flex items-start gap-3">
          <Info className="text-blue-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-medium text-white mb-1">Job Portal Management</h3>
            <p className="text-sm text-gray-300">
              Enable or disable job portals for scraping. Only portals marked as "Working" are 
              currently functional. Others require additional setup or have anti-bot protection.
            </p>
          </div>
        </div>
      </Card>

      {/* Working Portals */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="text-green-400" size={20} />
          Working Portals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portals.filter(p => p.is_active).map((portal) => {
            const setting = getPortalSetting(portal.id);
            
            return (
              <Card
                key={portal.id}
                className={`p-6 transition-all ${
                  setting.is_enabled ? 'border-green-500/50' : 'border-gray-700/50 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-700/30 to-green-800/30 rounded-lg flex items-center justify-center text-2xl border border-green-500/30">
                      {PORTAL_ICONS[portal.id] || '🌐'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{portal.display_name}</h3>
                      <Badge variant="success" className="mt-1">
                        Working
                      </Badge>
                    </div>
                  </div>
                  {['naukri', 'indeed'].includes(portal.id) && (
                    <button 
                      onClick={() => setExpandedPortal(expandedPortal === portal.id ? null : portal.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
                      title="Configuration"
                    >
                      <Settings size={20} />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {expandedPortal === portal.id ? (
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        <Shield size={14} className="text-blue-400" />
                        ScraperAPI Settings
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">API Key</label>
                        <div className="flex gap-2">
                          <input 
                            type="password"
                            value={apiKeys[portal.id] || ''}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, [portal.id]: e.target.value }))}
                            placeholder="Your ScraperAPI Key"
                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleTestKey(portal.id)}
                            disabled={testingKey === portal.id}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {testingKey === portal.id ? 'Testing...' : 'Test'}
                          </button>
                        </div>
                      </div>
                      <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-lg">
                        <p className="text-[11px] text-blue-300 leading-normal mb-2">
                          ScraperAPI is required to bypass bot detection on {portal.display_name}. 
                          The <b>Free Plan</b> provides 1,000 requests/month.
                        </p>
                        <a 
                          href="https://www.scraperapi.com?fp_ref=hiraeth099" 
                          target="_blank" 
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Get Free API Key <Settings size={12} className="rotate-45" />
                        </a>
                      </div>
                      <button 
                        onClick={() => handleConfigUpdate(portal.id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-900/20 transition-all active:scale-95"
                      >
                        <Save size={16} /> Save & Apply Config
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Enable Scraping</span>
                        <Toggle
                          checked={setting.is_enabled}
                          onChange={(val) => handleToggle(portal.id, val)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Priority</label>
                        <select
                          value={setting.priority}
                          onChange={(e) => handlePriorityChange(portal.id, parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!setting.is_enabled}
                        >
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <option key={num} value={num}>
                              Priority {num}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Non-working portals info */}
      <div>
        <h2 className="text-lg font-bold text-gray-400 mb-4 flex items-center gap-2">
          <AlertCircle className="text-gray-500" size={20} />
          Unavailable Portals
        </h2>
        <Card className="p-4 bg-gray-800/30 border-gray-700/50">
          <p className="text-sm text-gray-400 mb-3">
            The following portals are temporarily unavailable due to anti-bot protection or API issues:
          </p>
          <div className="flex flex-wrap gap-2">
            {['Instahyre', 'Wellfound', 'Cutshort'].map((name) => (
              <Badge key={name} variant="default">
                {name}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            We're working on adding improved automation support for these portals.
          </p>
        </Card>
      </div>
    </div>
  );
}
