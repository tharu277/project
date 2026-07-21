
export function calculateDistance(loc1, loc2) {
  if (!loc1||!loc2) return 0;
  const R = 6371;
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(loc1.lat*Math.PI/180)*Math.cos(loc2.lat*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function calculateETA(busLoc, stopLoc, speed) {
  if (!busLoc||!stopLoc) return null;
  const dist = calculateDistance(busLoc, stopLoc);
  const spd  = speed > 2 ? speed : 30;
  return Math.round((dist/spd)*60);
}

export function formatETA(mins) {
  if (mins===null||mins===undefined) return 'N/A';
  if (mins < 1)  return 'Arriving now';
  if (mins < 60) return `${mins} min`;
  const h=Math.floor(mins/60), m=mins%60;
  return m>0 ? `${h}h ${m}m` : `${h}h`;
}
