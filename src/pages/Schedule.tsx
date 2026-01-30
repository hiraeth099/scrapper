import { useAuth } from '../context/AuthContext';
import { SLOTS } from '../lib/constants';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Clock, Info, Calendar } from 'lucide-react';

export function Schedule() {
  const { profile } = useAuth();

  if (!profile) return null;

  const userSlot = SLOTS[profile.assigned_slot];
  const now = new Date();
  const nextRun = new Date();
  
  // Parse time properly with AM/PM
  const timeStr = userSlot.time; // e.g., "2:00 PM"
  const [time, period] = timeStr.split(' '); // ["2:00", "PM"]
  let [hour, minute] = time.split(':').map(Number); // [2, 0]
  
  // Convert to 24-hour format
  if (period === 'PM' && hour !== 12) {
    hour += 12; // 2 PM → 14
  } else if (period === 'AM' && hour === 12) {
    hour = 0; // 12 AM → 0
  }
  
  nextRun.setHours(hour, minute || 0, 0, 0);

  if (nextRun < now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const timeUntilRun = nextRun.getTime() - now.getTime();
  const hoursUntil = Math.floor(timeUntilRun / (1000 * 60 * 60));
  const minutesUntil = Math.floor((timeUntilRun % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Scraping Schedule</h1>
        <p className="text-gray-400 mt-1">View daily job scraping time slots</p>
      </div>

      <Card className="p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30">
            {userSlot.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">Your Assigned Slot</h2>
              <Badge variant="info">Active</Badge>
            </div>
            <p className="text-lg text-gray-300 mb-4">
              {userSlot.label} - {userSlot.time} IST
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="text-blue-400" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Next run in</p>
                  <p className="text-xl font-bold text-white">
                    {hoursUntil}h {minutesUntil}m
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="text-purple-400" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Next run date</p>
                  <p className="text-lg font-medium text-white">
                    {nextRun.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-blue-600/10 border-blue-500/30">
        <div className="flex items-start gap-3">
          <Info className="text-blue-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-medium text-white mb-1">About Time Slots</h3>
            <p className="text-sm text-gray-300">
              Time slots are assigned by your admin and cannot be changed. Each user gets a
              dedicated time slot to ensure optimal scraping performance. Jobs are automatically
              scraped at your assigned time based on your preferences and enabled portals.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-white mb-6">All Daily Slots</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(SLOTS).map(([key, slot]) => {
            const isUserSlot = key === profile.assigned_slot;
            const isPast = parseInt(slot.time.split(':')[0]) < now.getHours();

            return (
              <div
                key={key}
                className={`p-5 rounded-xl border transition-all ${
                  isUserSlot
                    ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/20'
                    : 'bg-gray-800/30 border-gray-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                      isUserSlot
                        ? 'bg-gradient-to-br from-blue-600 to-blue-500'
                        : 'bg-gray-700'
                    }`}
                  >
                    {slot.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{slot.label}</h3>
                      {isUserSlot && <Badge variant="info">Your Slot</Badge>}
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{slot.time}</p>
                    <p className="text-sm text-gray-400">
                      {isUserSlot ? (
                        <>Next run in {hoursUntil}h {minutesUntil}m</>
                      ) : isPast ? (
                        'Completed for today'
                      ) : (
                        'Upcoming today'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
        <div className="space-y-4">
          <Step
            number={1}
            title="Scheduled Execution"
            description="At your assigned time, our system automatically triggers the job scraping process for your account."
          />
          <Step
            number={2}
            title="Portal Scraping"
            description="Jobs are scraped from your enabled portals based on priority order. Higher priority portals are scraped first."
          />
          <Step
            number={3}
            title="AI Matching"
            description="Each job is analyzed and scored (0-100) based on your resume, preferences, and requirements using AI."
          />
          <Step
            number={4}
            title="Results Available"
            description="New jobs appear in your feed immediately after scraping completes. High matches (80%+) are highlighted."
          />
        </div>
      </Card>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <h3 className="font-medium text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}
