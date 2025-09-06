export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // ---- GET /env-check
      if (url.pathname === "/env-check" && request.method === "GET") {
        return new Response(JSON.stringify({
          ok: true,
          has_TURNSTILE_SECRET: !!env.TURNSTILE_SECRET,
          TURNSTILE_SITE_KEY_present: !!env.TURNSTILE_SITE_KEY,
          SEND_TO: env.SEND_TO || null,
          SEND_DOMAIN: env.SEND_DOMAIN || null,
          has_MC_API_KEY: !!env.MC_API_KEY,
        }), { headers: { "content-type": "application/json; charset=utf-8" }});
      }

      // ---- POST /contact
      if (url.pathname === "/contact" && request.method === "POST") {
        try {
          const ct = request.headers.get("content-type") || "";
          let name = "", email = "", message = "", token = "";

          if (ct.includes("application/x-www-form-urlencoded")) {
            const bodyText = await request.text();
            const p = new URLSearchParams(bodyText);
            name = (p.get("name") || "").trim();
            email = (p.get("email") || "").trim();
            message = (p.get("message") || "").trim();
            token = p.get("cf-turnstile-response") || "";
            console.log("Parser:", "urlencoded");
          } else if (ct.includes("multipart/form-data")) {
            const form = await request.formData();
            name = (form.get("name") || "").toString().trim();
            email = (form.get("email") || "").toString().trim();
            message = (form.get("message") || "").toString().trim();
            token = form.get("cf-turnstile-response") || "";
            const keys = []; for (const [k] of form.entries()) keys.push(k);
            console.log("Parser:", "form-data; keys:", keys.join(", "));
          } else {
            console.log("Parser:", "unknown content-type:", ct);
          }

          console.log("Has Turnstile token:", !!token);
          if (!token) return json(400, { ok: false, error: "turnstile_token_missing" });

          // 1) Verify Turnstile
          const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              secret: env.TURNSTILE_SECRET || "",
              response: token
            }),
          });
          const verifyData = await verifyRes.json();
          console.log("Turnstile:", verifyData);
          if (!verifyData.success) {
            return json(400, { ok: false, error: "turnstile_failed", details: verifyData["error-codes"] });
          }

          // 2) Prepare email
          const SEND_TO = env.SEND_TO;
          const SEND_DOMAIN = env.SEND_DOMAIN;
          const FROM_NAME = env.FROM_NAME || "Website Contact";
          const REPLY_TO = email || env.REPLY_TO || "";

          if (!SEND_TO || !SEND_DOMAIN) {
            return json(500, { ok: false, error: "mail_env_missing", hint: "Нужны SEND_TO и SEND_DOMAIN" });
          }
          if (!env.MC_API_KEY) {
            return json(500, { ok: false, error: "missing_MC_API_KEY" });
          }

          const mail = {
            personalizations: [{ to: [{ email: SEND_TO }] }],
            from: { email: `noreply@${SEND_DOMAIN}`, name: FROM_NAME },
            subject: `Сообщение с сайта: ${name || "без имени"}`,
            content: [{ type: "text/plain", value: `От: ${name}\nEmail: ${email}\n\n${message}` }],
            headers: REPLY_TO ? { "Reply-To": REPLY_TO } : undefined,
          };

          // 3) Send via MailChannels (API key required)
          const mcRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "X-Api-Key": env.MC_API_KEY,
            },
            body: JSON.stringify(mail),
          });

          const text = await mcRes.text();
          console.log("MailChannels:", mcRes.status, text.slice(0, 300));

          if (!mcRes.ok) {
            return json(mcRes.status, { ok: false, error: "mailchannels_failed", status: mcRes.status, text });
          }

          return json(200, { ok: true, sent: true });
        } catch (e) {
          console.log("Contact handler error:", e.stack || e.toString());
          return json(500, { ok: false, error: "server_error", details: String(e) });
        }
      }

      // ---- static fallback
      return env.ASSETS.fetch(request);
    } catch (e) {
      // ловим внезапные ошибки (чтобы не было 1101)
      return new Response(JSON.stringify({ ok: false, error: "unhandled", details: String(e) }), {
        status: 500, headers: { "content-type": "application/json; charset=utf-8" }
      });
    }
  }
}

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

