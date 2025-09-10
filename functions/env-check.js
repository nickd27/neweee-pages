export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({
    ok: true,
    has_TURNSTILE_SECRET: !!env.TURNSTILE_SECRET,
    TURNSTILE_SITE_KEY_present: !!env.TURNSTILE_SITE_KEY,
    SEND_TO: env.SEND_TO || null,
    SEND_DOMAIN: env.SEND_DOMAIN || null
  }), { headers: { "content-type": "application/json; charset=utf-8" }});
}
