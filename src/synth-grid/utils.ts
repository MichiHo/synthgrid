export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

export const min_db = -60;
export function dbToLin(db: number, mindB = min_db) {
  if (db <= mindB) return 0;
  return Math.pow(10, db / 20.0);
}
export function linToDb(lin: number, mindB = min_db) {
  if (lin < dbToLin(mindB)) return mindB;
  return 20.0 * Math.log10(lin);
}
export const dbFormat = {
  to: dbToLin,
  from: linToDb,
};
export const smallHzFormat = (v: number) => {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}kHz`;
  else return `${v.toFixed(0)}Hz`;
};
