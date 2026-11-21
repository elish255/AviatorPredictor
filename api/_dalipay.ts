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

type DalipayErrorCode = 'AUTHENTICATION' | 'ACCESS_DENIED' | 'VALIDATION' | 'RATE_LIMITED' | 'UPSTREAM_ERROR' | 'INVALID_RESPONSE' | 'NETWORK_ERROR' | 'TIMEOUT' | 'NOT_CONFIGURED';

const errorMessages: Record<DalipayErrorCode, string> = {
  AUTHENTICATION: 'Dalipay imekataa uthibitisho wa API. Msimamizi ahakiki jozi ya keys na mazingira yake.',
  ACCESS_DENIED: 'Dalipay imekataa ruhusa ya ombi. Msimamizi ahakiki IP whitelist na ruhusa za akaunti.',
  VALIDATION: 'Dalipay imekataa taarifa za ombi la malipo. Msimamizi aangalie kumbukumbu ya uchunguzi.',
  RATE_LIMITED: 'Dalipay imepokea maombi mengi. Tafadhali subiri kabla ya kujaribu tena.',
  UPSTREAM_ERROR: 'Dalipay haijakamilisha ombi. Msimamizi aangalie kumbukumbu ya uchunguzi.',
  INVALID_RESPONSE: 'Jibu la Dalipay halijatambulika. Msimamizi aangalie kumbukumbu ya uchunguzi.',
  NETWORK_ERROR: 'Imeshindikana kuwasiliana na Dalipay. Usirudie malipo kabla ya kuhakiki ombi la awali.',
  TIMEOUT: 'Dalipay haikujibu kwa wakati. Usirudie malipo kabla ya kuhakiki ombi la awali.',
  NOT_CONFIGURED: 'Dalipay haijawekwa tayari.'
};

export class DalipayError extends Error {
  readonly diagnosticId = randomUUID();
  constructor(readonly code: DalipayErrorCode, readonly httpStatus: number, readonly upstreamStatus?: number) {
    super(errorMessages[code]);
    this.name = 'DalipayError';
  }
}

// Only fixed categories and field names may leave this module. Never log or
// forward raw provider messages, payloads, headers, URLs, or caught exceptions.
const validationMessages: Record<string, string> = {
  'external_id is required': 'external_id',
  'external_id must be 30 characters or fewer': 'external_id',
  'amount must be between 1 and 5,000,000': 'amount',
  'account_number must be a valid Tanzanian phone number': 'account_number',
  'provider must be one of: Airtel, Tigo, Azampesa, Halopesa, Mpesa': 'provider'
};

function fail(code: DalipayErrorCode, httpStatus: number, operation: 'create' | 'status', upstreamStatus?: number, result?: unknown): never {
  const error = new DalipayError(code, httpStatus, upstreamStatus);
  const message = result && typeof result === 'object' && 'message' in result ? result.message : undefined;
  const field = typeof message === 'string' && Object.hasOwn(validationMessages, message)
    ? validationMessages[message] : undefined;
  console.error('dalipay_request_failed', {
    diagnosticId: error.diagnosticId,
    operation,
    code,
    ...(upstreamStatus !== undefined ? { upstreamStatus } : {}),
    ...(code === 'VALIDATION' && field ? { field } : {})
  });
  throw error;
}

export async function dalipayRequest(path: string, payload?: Record<string, unknown>) {
  const operation = payload ? 'create' : 'status';
  if (!dalipayConfigured()) fail('NOT_CONFIGURED', 503, operation);
  let response: Response;
  let result: any;
  try {
    response = await fetch(`https://app.dalipay.co.tz/api/v1/collections${path}`, {
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
    result = await response.json().catch((error: unknown) => {
      if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw error;
      return null;
    });
  } catch (error: unknown) {
    const timeout = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name);
    fail(timeout ? 'TIMEOUT' : 'NETWORK_ERROR', timeout ? 504 : 502, operation);
  }
  if (!response.ok) {
    if (response.status === 401) fail('AUTHENTICATION', 502, operation, response.status);
    if (response.status === 403) fail('ACCESS_DENIED', 502, operation, response.status);
    if ([400, 422].includes(response.status)) fail('VALIDATION', 400, operation, response.status, result);
    if (response.status === 429) fail('RATE_LIMITED', 503, operation, response.status);
    fail('UPSTREAM_ERROR', 502, operation, response.status);
  }
  if (result?.success === false) fail('UPSTREAM_ERROR', 502, operation, response.status);
  if (result?.success !== true || !result?.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
    fail('INVALID_RESPONSE', 502, operation, response.status);
  }
  return result.data;
}
