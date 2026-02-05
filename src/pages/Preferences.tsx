import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SLOTS } from '../lib/constants';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { RangeSlider, Slider } from '../components/ui/Slider';
import { useToast } from '../components/ui/Toast';
import { User, Briefcase, Code } from 'lucide-react';

interface Preferences {
  target_roles: string[];
  min_salary: number;
  max_salary: number | null;
  preferred_locations: string[];
  remote_only: boolean;
  internships_only: boolean;
  min_experience: number;
  max_experience: number;
  resume_json: Record<string, any>;
}

export function Preferences() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    target_roles: [],
    min_salary: 1200000,
    max_salary: null,
    preferred_locations: [],
    remote_only: false,
    internships_only: false,
    min_experience: 0,
    max_experience: 15,
    resume_json: {},
  });

  const [roleInput, setRoleInput] = useState('');
  const [resumeJsonText, setResumeJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (profile) {
      fetchPreferences();
    }
  }, [profile]);

  const fetchPreferences = async () => {
    try {
      const data = await api.getUserPreferences(profile!.id);

      if (data) {
        const prefs = {
          target_roles: data.target_roles || [],
          min_salary: data.min_salary_inr || 1200000,
          max_salary: data.max_salary_inr,
          preferred_locations: data.preferred_locations || [],
          remote_only: data.remote_only || false,
          internships_only: data.internships_only || false,
          min_experience: data.min_experience_years || 0,
          max_experience: data.max_experience_years || 15,
          resume_json: data.resume_json || {},
        };
        setPreferences(prefs);
        setResumeJsonText(JSON.stringify(prefs.resume_json, null, 2));
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      showToast('Failed to load preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeJsonChange = (text: string) => {
    setResumeJsonText(text);
    setJsonError(''); // Clear error while typing
  };

  const validateAndUpdateResumeJson = () => {
    try {
      const parsed = JSON.parse(resumeJsonText);
      setPreferences({ ...preferences, resume_json: parsed });
      setJsonError('');
      showToast('Resume JSON validated ✓', 'success');
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const handleSave = async () => {
    // Validate JSON before saving
    try {
      const parsed = JSON.parse(resumeJsonText);
      
      setSaving(true);
      await api.updateUserPreferences(profile!.id, {
        target_roles: preferences.target_roles,
        min_salary_inr: preferences.min_salary,
        max_salary_inr: preferences.max_salary,
        preferred_locations: preferences.preferred_locations,
        remote_only: preferences.remote_only,
        min_experience_years: preferences.min_experience,
        max_experience_years: preferences.max_experience,
        resume_json: parsed,
      });
      
      showToast('Preferences saved successfully!', 'success');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      if (error.name === 'SyntaxError') {
        showToast('Invalid JSON in resume - please check formatting', 'error');
        setJsonError('Invalid JSON format');
      } else {
        showToast('Failed to save preferences', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const addRole = () => {
    if (roleInput.trim() && !preferences.target_roles.includes(roleInput.trim())) {
      setPreferences({
        ...preferences,
        target_roles: [...preferences.target_roles, roleInput.trim()],
      });
      setRoleInput('');
    }
  };

  const removeRole = (role: string) => {
    setPreferences({
      ...preferences,
      target_roles: preferences.target_roles.filter((r) => r !== role),
    });
  };


  const removeLocation = (location: string) => {
    setPreferences({
      ...preferences,
      preferred_locations: preferences.preferred_locations.filter((l) => l !== location),
    });
  };

  if (!profile || loading) {
    return <div className="text-white">Loading...</div>;
  }

  const slot = SLOTS[profile.assigned_slot];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <User size={24} className="text-blue-400" />
          <h2 className="text-xl font-bold text-white">Profile Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <Input value={profile.name} disabled />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <Input value={profile.username} disabled />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Assigned Time Slot</label>
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg">
              <span className="text-2xl">{slot.icon}</span>
              <div>
                <p className="font-medium text-white">{slot.label}</p>
                <p className="text-sm text-gray-400">{slot.time}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Account Status</label>
            <Badge variant={profile.status === 'active' ? 'success' : 'danger'} className="text-base px-4 py-2">
              {profile.status}
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Briefcase size={24} className="text-blue-400" />
          <h2 className="text-xl font-bold text-white">Job Preferences</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Target Roles</label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="e.g., Platform Engineer"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRole()}
              />
              <Button onClick={addRole}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.target_roles.map((role) => (
                <Badge key={role} variant="info" className="cursor-pointer" onClick={() => removeRole(role)}>
                  {role} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Slider
              label="Minimum Salary"
              min={0}
              max={5000000}
              step={100000}
              value={preferences.min_salary}
              onChange={(val) => setPreferences({ ...preferences, min_salary: val })}
              unit={` (₹${(preferences.min_salary / 100000).toFixed(1)}L)`}
            />

            <RangeSlider
              label="Experience Range"
              min={0}
              max={20}
              minValue={preferences.min_experience}
              maxValue={preferences.max_experience}
              onChange={(min, max) =>
                setPreferences({ ...preferences, min_experience: min, max_experience: max })
              }
              unit=" years"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preferred Locations 
              <span className="text-xs text-gray-500 ml-2">(Click to add, first = highest priority)</span>
            </label>
            
            {/* Selected locations with priority order */}
            {preferences.preferred_locations.length > 0 && (
              <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">Your priority order (click to remove):</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.preferred_locations.map((location, index) => (
                    <Badge 
                      key={location} 
                      variant={index === 0 ? 'success' : 'info'} 
                      onClick={() => removeLocation(location)}
                    >
                      {index + 1}. {location} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Available cities to select */}
            <p className="text-xs text-gray-400 mb-2">Available cities (click to add):</p>
            <div className="flex flex-wrap gap-2">
              {['Hyderabad', 'Bangalore', 'Gurgaon', 'Mumbai', 'Pune', 'Chennai', 'Kolkata', 'Kochi', 'Noida', 'Delhi', 'Remote', 'US', 'UK', 'Singapore'].map((city) => {
                const isSelected = preferences.preferred_locations.includes(city);
                return (
                  <button
                    key={city}
                    onClick={() => {
                      if (isSelected) {
                        removeLocation(city);
                      } else {
                        setPreferences({
                          ...preferences,
                          preferred_locations: [...preferences.preferred_locations, city]
                        });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <Toggle
              checked={preferences.remote_only}
              onChange={(val) => setPreferences({ ...preferences, remote_only: val })}
              label="Remote Only"
            />
            <Toggle
              checked={preferences.internships_only}
              onChange={(val) => setPreferences({ ...preferences, internships_only: val })}
              label="🎓 Internships Only"
            />
          </div>
          {preferences.internships_only && (
            <p className="text-xs text-blue-400 mt-2 bg-blue-500/10 p-3 rounded-lg">
              📌 When enabled, the scraper will only search for internship positions. 
              Experience requirements will be ignored.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Code size={24} className="text-blue-400" />
          <h2 className="text-xl font-bold text-white">Resume JSON</h2>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          This JSON data is used by the AI to score and match jobs based on your profile.
        </p>

        <textarea
          value={resumeJsonText}
          onChange={(e) => handleResumeJsonChange(e.target.value)}
          onBlur={validateAndUpdateResumeJson}
          className={`w-full h-64 px-4 py-3 bg-gray-800/50 border ${
            jsonError ? 'border-red-500' : 'border-gray-700'
          } rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 ${
            jsonError ? 'focus:ring-red-500' : 'focus:ring-blue-500'
          }`}
          placeholder={`{
  "experience_years": 5,
  "current_role": "Platform Engineer",
  "skills": ["Kubernetes", "AWS", "Python"],
  "projects": [],
  "certifications": [],
  "education": ""
}`}
        />
        {jsonError && (
          <p className="text-red-500 text-xs mt-2 font-mono">{jsonError}</p>
        )}
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
