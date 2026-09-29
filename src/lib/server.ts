declare const process: { env: Record<string, string | undefined> };
export type JsonRecord = Record<string, unknown>;

function env(name: string): string {
  return (process.env[name] ?? '').trim();
}

export function supabaseConfig() {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_PUBLISHABLE_KEY');
  if (!url || !key) throw new Error('Database configuration is missing.');
  return { url: url.replace(/\/$/, ''), key };
}

export async function supabaseRequest(
  method: string,
  table: string,
  query: Record<string, string> = {},
  body?: JsonRecord,
) {
  const { url, key } = supabaseConfig();
  const qs = new URLSearchParams(query).toString();
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}${qs ? `?${qs}` : ''}`;
  const response = await fetch(endpoint, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data: unknown = [];
  try { data = text ? JSON.parse(text) : []; } catch { data = []; }
  return { ok: response.ok, status: response.status, data, raw: text };
}

export async function supabaseFirst(table: string, filters: Record<string, string>) {
  const result = await supabaseRequest('GET', table, { select: '*', ...filters, limit: '1' });
  if (!result.ok || !Array.isArray(result.data)) return null;
  return (result.data[0] as JsonRecord | undefined) ?? null;
}

export async function supabaseUpdate(table: string, filters: Record<string, string>, values: JsonRecord) {
  const result = await supabaseRequest('PATCH', table, filters, values);
  return result.ok && Array.isArray(result.data) ? result.data : null;
}

export async function supabaseInsert(table: string, values: JsonRecord) {
  const result = await supabaseRequest('POST', table, {}, values);
  if (!result.ok || !Array.isArray(result.data)) return null;
  return (result.data[0] as JsonRecord | undefined) ?? null;
}

export function normalizeTanzaniaPhone(input: string): string {
  const phone = input.replace(/[^0-9]/g, '');
  if (/^0[67][0-9]{8}$/.test(phone)) return `255${phone.slice(1)}`;
  if (/^255[67][0-9]{8}$/.test(phone)) return phone;
  return '';
}

export function packageAmount(pkg: number): number {
  return pkg === 1 ? 2000 : pkg === 2 ? 3000 : pkg === 3 ? 5000 : 0;
}

export function packageRedirect(pkg: number): string {
  return pkg === 1 ? '/package2' : pkg === 2 ? '/package3' : '/dashboard';
}

export function cycleValues(pkg: number, cycleNo: number) {
  if (pkg === 3) {
    return {
      package1_status: 'locked', package2_status: 'locked', package3_status: 'locked',
      current_package: 0, payment_status: 'pending', completed: 1,
      last_page: '/dashboard', cycle_no: cycleNo + 1,
    };
  }
  return {
    package1_status: 'paid',
    package2_status: pkg >= 2 ? 'paid' : 'locked',
    package3_status: 'locked',
    current_package: pkg, payment_status: 'paid', completed: 0,
    last_page: packageRedirect(pkg), cycle_no: cycleNo,
  };
}

export function packagePaid(user: JsonRecord, pkg: number): boolean {
  return String(user[`package${pkg}_status`] ?? '').toLowerCase() === 'paid';
}

export function packageAllowed(user: JsonRecord, pkg: number): boolean {
  if (pkg === 1) return true;
  if (pkg === 2) return packagePaid(user, 1);
  if (pkg === 3) return packagePaid(user, 2);
  return false;
}

export function json(res: VercelResponse, payload: JsonRecord, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.end(JSON.stringify(payload));
}

export type VercelRequest = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

export type VercelResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};
