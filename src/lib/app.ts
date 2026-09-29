export type User = Record<string, any> & { id: number; phone?: string };

const USER_KEY = 'aviator_user_id';
const PHONE_KEY = 'aviator_phone';
const SITE_KEY = 'aviator_site';
const IMAGE_KEY = 'aviator_site_image';

export const packages = {
  1: { name: 'APP ID PAYMENT', title: 'LIPIA ACCESS', amount: 2000, description: 'Siku 7 Bure', features: ['Full Predictor', 'Live Odds'] },
  2: { name: 'VPN SETUP PAYMENT', title: 'VPN ACCESS', amount: 3000, description: 'LIPIA VPN CONFIGURATIONS', features: ['Live Odds', 'Matumizi Bila Kikomo'] },
  3: { name: 'CONNECT APP PAYMENT', title: '🏆 CONNECT ACCOUNT', amount: 5000, description: 'Full Access', features: ['Full Account Linking', 'Live Odds', 'VIP Support'] },
} as const;

export function setUser(user: User) {
  localStorage.setItem(USER_KEY, String(user.id));
  localStorage.setItem(PHONE_KEY, String(user.phone ?? ''));
}
export function getUserId() { return Number(localStorage.getItem(USER_KEY) ?? 0); }
export function clearUser() {
  [USER_KEY, PHONE_KEY, SITE_KEY, IMAGE_KEY].forEach((key) => localStorage.removeItem(key));
}
export function setSite(name: string, image: string) {
  localStorage.setItem(SITE_KEY, name);
  localStorage.setItem(IMAGE_KEY, image);
}
export function getSite() {
  return { name: localStorage.getItem(SITE_KEY) ?? 'Unknown', image: localStorage.getItem(IMAGE_KEY) ?? '' };
}
export function paid(user: User, pkg: number) { return String(user[`package${pkg}_status`] ?? '').toLowerCase() === 'paid'; }
export function allowed(user: User, pkg: number) { return pkg === 1 || (pkg === 2 && paid(user, 1)) || (pkg === 3 && paid(user, 2)); }
export function redirectForPackage(pkg: number) { return pkg === 1 ? '/package2' : pkg === 2 ? '/package3' : '/dashboard'; }

export async function getCurrentUser(): Promise<User | null> {
  const id = getUserId();
  if (!id) return null;
  const response = await fetch(`/api/user?id=${id}&_=${Date.now()}`, { cache: 'no-store' });
  const data = await response.json().catch(() => null);
  return data?.success && data.user ? data.user as User : null;
}


export async function registerWithPhone(phone: string) {
  const clean = phone.replace(/[^0-9]/g, '');
  if (!/^0[67][0-9]{8}$/.test(clean)) throw new Error('Tafadhali ingiza namba sahihi ya simu, mfano 0712345678.');
  const response = await fetch('/api/auth-register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: clean }) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success || !data.user) throw new Error(data?.message || 'Imeshindikana kujisajili.');
  setUser(data.user as User);
  return data.user as User;
}

export async function loginWithPhone(phone: string) {
  const clean = phone.replace(/[^0-9]/g, '');
  if (!/^0[67][0-9]{8}$/.test(clean)) throw new Error('Tafadhali ingiza namba sahihi ya simu, mfano 0712345678.');
  const response = await fetch('/api/auth-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: clean }) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success || !data.user) throw new Error(data?.message || 'Imeshindikana kuingia.');
  setUser(data.user as User);
  return data.user as User;
}

export async function updateUser(values: Record<string, unknown>) {
  const id = getUserId();
  if (!id) return false;
  const clientResponse = await fetch('/api/user-update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id, values }) });
  const data = await clientResponse.json().catch(() => null);
  return Boolean(data?.success);
}

export async function saveBettingSite(name: string, image: string) {
  const response = await fetch('/api/save-site', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: getUserId(), name, imgSrc: image }) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) throw new Error(data?.message || 'Imeshindikana kuhifadhi uchaguzi.');
  setSite(name, data.image || image);
}
