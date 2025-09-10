export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // ---- GET /env-check
      if (url.pathname === "/env-check" && request.method === "GET") {
        return new Response(JSON.stringify({
          ok: true,
          host: url.hostname,
          has_TURNSTILE_SECRET_PAGES: !!env.TURNSTILE_SECRET_PAGES,
          has_TURNSTILE_SECRET_PROD:  !!env.TURNSTILE_SECRET_PROD,
          has_MC_API_KEY: !!env.MC_API_KEY,
          SEND_TO: env.SEND_TO || null,
          SEND_DOMAIN: env.SEND_DOMAIN || null,
          // DKIM диагностика
          has_DKIM_SELECTOR: !!env.DKIM_SELECTOR,
          has_DKIM_PRIVATE_KEY: !!env.DKIM_PRIVATE_KEY, // ожидается base64 ОДНОЙ строкой
          dkim_domain_effective: (env.DKIM_DOMAIN || env.SEND_DOMAIN || null)
        }), { headers: { "content-type": "application/json; charset=utf-8" }});
      }

      // ---- POST /contact
      if (url.pathname === "/contact" && request.method === "POST") {
        try {
          // ---- читаем форму
          const ct = request.headers.get("content-type") || "";
          let name="", email="", message="", token="";
          if (ct.includes("application/x-www-form-urlencoded")) {
            const bodyText = await request.text();
            const p = new URLSearchParams(bodyText);
            name = (p.get("name") || "").trim();
            email = (p.get("email") || "").trim();
            message = (p.get("message") || "").trim();
            token = p.get("cf-turnstile-response") || "";
          } else if (ct.includes("multipart/form-data")) {
            const form = await request.formData();
            name = (form.get("name") || "").toString().trim();
            email = (form.get("email") || "").toString().trim();
            message = (form.get("message") || "").toString().trim();
            token = form.get("cf-turnstile-response") || "";
          }

          if (!token) return json(400, { ok:false, error:"turnstile_token_missing" });

          // ---- секрет Turnstile по хосту
          const host = url.hostname;
          const secret =
            host.endsWith("neweee-pages.pages.dev") ? (env.TURNSTILE_SECRET_PAGES || env.TURNSTILE_SECRET)
          : (host === "neweee.com" || host === "www.neweee.com") ? (env.TURNSTILE_SECRET_PROD || env.TURNSTILE_SECRET)
          : (env.TURNSTILE_SECRET || "");

          // ---- verify Turnstile
          const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ secret, response: token }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success) {
            return json(400, { ok:false, error:"turnstile_failed", details: verifyData["error-codes"] });
          }

          // ---- отправляем письмо
          return await sendMail(env, { name, email, message });

        } catch (e) {
          console.log("Contact handler error:", e.stack || e);
          return json(500, { ok:false, error:"server_error", details: String(e) });
        }
      }

      // ---- статика
      return env.ASSETS.fetch(request);

    } catch (e) {
      return new Response(JSON.stringify({ ok:false, error:"unhandled", details: String(e) }), {
        status: 500, headers: { "content-type": "application/json; charset=utf-8" }
      });
    }
  }
}

async function sendMail(env, { name, email, message }) {
  const SEND_TO = env.SEND_TO;
  const SEND_DOMAIN = env.SEND_DOMAIN;
  const FROM_NAME = env.FROM_NAME || "Website Contact";
  const REPLY_TO = email || env.REPLY_TO || "";

  if (!SEND_TO || !SEND_DOMAIN) {
    return json(500, { ok:false, error:"mail_env_missing", hint:"Нужны SEND_TO и SEND_DOMAIN" });
  }
  if (!env.MC_API_KEY) {
    return json(500, { ok:false, error:"missing_MC_API_KEY" });
  }

  // ---- DKIM параметры (ВАЖНО: ключ — ОДНОЙ строкой base64 DER)
  const dkimDomain   = env.DKIM_DOMAIN || SEND_DOMAIN;   // d=
  const dkimSelector = env.DKIM_SELECTOR || "";          // s=
  const dkimKeyB64   = env.DKIM_PRIVATE_KEY || "";       // base64 (без BEGIN/END)

  // ---- тело письма
  const personalizations = [{
    to: [{ email: SEND_TO }],
    // DKIM — строго внутри personalizations[0]
    ...(dkimKeyB64 && dkimSelector && dkimDomain ? {
      dkim_domain: dkimDomain,
      dkim_selector: dkimSelector,
      dkim_private_key: dkimKeyB64
    } : {})
  }];

  const mail = {
    personalizations,
    from: { email: `noreply@${SEND_DOMAIN}`, name: FROM_NAME },
    reply_to: REPLY_TO ? { email: REPLY_TO } : undefined,
    subject: `Сообщение с сайта: ${name || "без имени"}`,
    content: [{ type: "text/plain", value: `От: ${name}\nEmail: ${email}\n\n${message}` }],
  };

  // лог: включён ли DKIM (без утечки ключа)
  console.log("DKIM:", {
    enabled: !!(dkimKeyB64 && dkimSelector && dkimDomain),
    d: dkimDomain, s: dkimSelector,
    keyLen: dkimKeyB64 ? dkimKeyB64.length : 0
  });

  // ---- вызов MailChannels
  const mcRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Api-Key": env.MC_API_KEY,
    },
    body: JSON.stringify(mail),
  });

  const text = await mcRes.text();
  console.log("MailChannels:", mcRes.status, (text || "").slice(0, 200));

  if (!mcRes.ok) {
    return json(mcRes.status, { ok:false, error:"mailchannels_failed", status: mcRes.status, text });
  }
  const mcStatus = mcRes.status;
  const mcTrace = mcRes.headers.get("X-Message-Id") || mcRes.headers.get("x-request-id") || null;

  return json(200, { ok:true, sent:true, mcStatus, mcTrace });
}

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
