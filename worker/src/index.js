const ALLOWED_ORIGIN = 'https://friends-of-mine-game.github.io';
const MAX_BODY_BYTES = 200_000;

function cors(origin) {
  const allowed = origin === ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowed ? ALLOWED_ORIGIN : 'null',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...cors(origin)
    }
  });
}

function safeSegment(value, fallback = 'anonimo') {
  const cleaned = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return cleaned || fallback;
}

function toBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') return 'Payload inválido';
  if (typeof payload.test_id !== 'string' || !payload.test_id.trim()) return 'Falta test_id';
  if (typeof payload.version !== 'string' || !payload.version.trim()) return 'Falta version';
  if (!payload.responses || typeof payload.responses !== 'object' || Array.isArray(payload.responses)) return 'Faltan responses';
  if (Object.keys(payload.responses).length > 200) return 'Demasiadas respuestas';
  if (payload.participant != null && typeof payload.participant !== 'string') return 'participant inválido';
  return null;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      if (origin !== ALLOWED_ORIGIN) return new Response(null, { status: 403, headers: cors(origin) });
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, origin);
    if (origin !== ALLOWED_ORIGIN) return json({ ok: false, error: 'Origin not allowed' }, 403, origin);

    const declaredLength = Number(request.headers.get('Content-Length') || 0);
    if (declaredLength > MAX_BODY_BYTES) return json({ ok: false, error: 'Payload demasiado grande' }, 413, origin);

    let payload;
    try {
      const text = await request.text();
      if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
        return json({ ok: false, error: 'Payload demasiado grande' }, 413, origin);
      }
      payload = JSON.parse(text);
    } catch {
      return json({ ok: false, error: 'JSON inválido' }, 400, origin);
    }

    const validationError = validatePayload(payload);
    if (validationError) return json({ ok: false, error: validationError }, 400, origin);

    const receivedAt = new Date().toISOString();
    const id = crypto.randomUUID();
    const stored = {
      ...payload,
      received_at: receivedAt,
      response_id: id
    };

    const testId = safeSegment(payload.test_id, 'test');
    const participant = safeSegment(payload.participant, 'anonimo');
    const stamp = receivedAt.replace(/[:.]/g, '-');
    const path = `results/${testId}/${stamp}-${participant}-${id.slice(0, 8)}.json`;
    const body = JSON.stringify(stored, null, 2) + '\n';

    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;
    if (!owner || !repo || !env.GITHUB_TOKEN) {
      return json({ ok: false, error: 'Worker no configurado' }, 500, origin);
    }

    const githubResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'friends-of-mine-test-lab'
      },
      body: JSON.stringify({
        message: `guarda respuesta ${testId} ${id.slice(0, 8)}`,
        content: toBase64Utf8(body),
        branch: env.GITHUB_BRANCH || 'main'
      })
    });

    if (!githubResponse.ok) {
      const detail = await githubResponse.text();
      console.error('GitHub write failed', githubResponse.status, detail);
      return json({ ok: false, error: 'No se pudo persistir la respuesta' }, 502, origin);
    }

    return json({ ok: true, response_id: id, path }, 201, origin);
  }
};
