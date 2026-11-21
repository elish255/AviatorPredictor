import { randomUUID } from 'node:crypto';

export const DALIPAY_ORDER_PREFIX = 'dalipay_';
export const DALIPAY_PROVIDERS = ['Mpesa', 'Tigo', 'Airtel', 'Halopesa', 'Azampesa'] as const;

export function dalipayConfigured() {
  return Boolean(process.env.DALIPAY_PUBLIC_KEY?.trim() && process.env.DALIPAY_SECRET_KEY?.trim());
}

export function dalipayExternalId() {
  // Dalipay accepts at most 30 characters for a merchant reference.
  return `av_${randomUUID().replaceAll('-', '').slice(0, 27)}`;
}

export function dalipayStatus(value: unknown) {
  switch (String(value).toLowerCase()) {
    case 'success': return 'SUCCESS';
    case 'failed': return 'FAILED';
    case 'processing': return 'PENDING';
    default: throw new Error('Dalipay imerudisha hali ya malipo isiyotambulika');
  }
}

export async function dalipayRequest(path: string, payload?: Record<string, unknown>) {
  if (!dalipayConfigured()) throw new Error('Dalipay haijawekwa tayari');
  const response = await fetch(`https://dalipay.co.tz/api/v1/collections${path}`, {
    method: payload ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Public-Key': process.env.DALIPAY_PUBLIC_KEY!.trim(),
      'X-Secret-Key': process.env.DALIPAY_SECRET_KEY!.trim()
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
    signal: AbortSignal.timeout(15000)
  });
  // Never return raw gateway responses or authentication details to the browser.
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true || !result?.data) {
    throw new Error('Dalipay haijakamilisha ombi. Tafadhali jaribu tena baadaye.');
  }
  return result.data;
}
