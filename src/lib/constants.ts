export const SLOTS = {
  slot_1: { label: 'Early Morning', time: '6:00 AM', icon: '🌅' },
  slot_2: { label: 'Morning', time: '10:00 AM', icon: '☀️' },
  slot_3: { label: 'Afternoon', time: '2:00 PM', icon: '🌤️' },
  slot_4: { label: 'Evening', time: '6:00 PM', icon: '🌆' },
} as const;

export const APPLICATION_STATUSES = {
  interested: { label: 'Interested', color: 'gray' },
  applied: { label: 'Applied', color: 'blue' },
  callback: { label: 'Callback', color: 'yellow' },
  interview: { label: 'Interview', color: 'purple' },
  offer: { label: 'Offer', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
} as const;

export const PORTALS = [
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'naukri', name: 'Naukri.com', icon: '📋' },
  { id: 'indeed', name: 'Indeed', icon: '🔍' },
  { id: 'instahyre', name: 'Instahyre', icon: '🚀' },
  { id: 'wellfound', name: 'Wellfound', icon: '🌟' },
  { id: 'cutshort', name: 'Cutshort', icon: '⚡' },
] as const;
