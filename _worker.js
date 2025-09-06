export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route: GET /env-check
    if (url.pathname === "/env-check" && request.method === "GET") {
      const body = JSON.stringify({
        ok: true,
        has_TURNSTILE_SECRET: !!env.TURNSTILE_SECRET,
        TURNSTILE_SITE_KEY_present: !!env.TURNSTILE_SITE_KEY,
        SEND_TO: env.SEND_TO || null,
        SEND_DOMAIN: env.SEND_DOMAIN || null
      });
      return new Response(body, { headers: { "content-type": "application/json; charset=utf-8" } });
    }

    // Route: POST /contact
    if (url.pathname === "/contact" && request.method === "POST") {
      try {
        const form = await request.formData();
        const name = (form.get("name") || "").toString().trim();
        const email = (form.get("email") || "").toString().trim();
        const message = (form.get("message") || "").toString().trim();
        const token = form.get("cf-turnstile-response");

        if (!token) return json(400, { ok:false, error:"turnstile_token_missing" });

        // Verify Turnstile
        const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ secret: env.TURNSTILE_SECRET || "", response: token }),
        });
        const verifyData = await verifyRes.json();
        console.log("Turnstile:", verifyData);
        if (!verifyData.success) {
          return json(400, { ok:false, error:"turnstile_failed", details: verifyData["error-codes"] });
        }

        const SEND_TO = env.SEND_TO;
        const SEND_DOMAIN = env.SEND_DOMAIN;
        const FROM_NAME = env.FROM_NAME || "Website Contact";
        const REPLY_TO = email || env.REPLY_TO || "";

        if (!SEND_TO || !SEND_DOMAIN) {
          return json(500, { ok:false, error:"mail_env_missing", hint:"Нужны SEND_TO и SEND_DOMAIN" });
        }

        const mail = {
          personalizations: [{ to: [{ email: SEND_TO }] }],
          from: { email: `noreply@${SEND_DOMAIN}`, name: FROM_NAME },
          subject: `Сообщение с сайта: ${name || "без имени"}`,
          content: [{ type: "text/plain", value: `От: ${name}\nEmail: ${email}\n\n${message}` }],
          headers: REPLY_TO ? { "Reply-To": REPLY_TO } : undefined,
        };

        const mcRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(mail),
        });

        const text = await mcRes.text();
        console.log("MailChannels:", mcRes.status, text.slice(0, 300));

        if (!mcRes.ok) {
          return json(mcRes.status, { ok:false, error:"mailchannels_failed", status: mcRes.status, text });
        }

        return json(200, { ok:true, sent:true });
      } catch (e) {
        console.log("Handler error:", e.toString());
        return json(500, { ok:false, error:"server_error" });
      }
    }

    // Static assets fallback
    return env.ASSETS.fetch(request);
  }
}

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
