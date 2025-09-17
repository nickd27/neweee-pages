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
            var phone = (p.get("phone") || "").trim();
            var company = (p.get("company") || "").trim();
            var service = (p.get("service") || "").trim();
            var deadline = (p.get("deadline") || "").trim();
            token = p.get("cf-turnstile-response") || "";
          } else if (ct.includes("multipart/form-data")) {
            const form = await request.formData();
            name = (form.get("name") || "").toString().trim();
            email = (form.get("email") || "").toString().trim();
            message = (form.get("message") || "").toString().trim();
            token = form.get("cf-turnstile-response") || "";
            var phone = (form.get("phone") || "").toString().trim();
            var company = (form.get("company") || "").toString().trim();
            var service = (form.get("service") || "").toString().trim();
            var deadline = (form.get("deadline") || "").toString().trim();
            var uploadedFiles = form.getAll("files").filter(f => f && typeof f.name === "string");
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
          return await sendMail(env, { name, email, message, phone, company, service, deadline, uploadedFiles });

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

async function sendMail(env, { name, email, message, phone="", company="", service="", deadline="", uploadedFiles=[] }) {
  const SEND_TO = env.SEND_TO;
  const SEND_DOMAIN = env.SEND_DOMAIN;
  const FROM_NAME = env.FROM_NAME || "Neweee";
  const REPLY_TO = email || env.REPLY_TO || "";

  if (!SEND_TO || !SEND_DOMAIN) {
    return json(500, { ok:false, error:"mail_env_missing", hint:"Нужны SEND_TO и SEND_DOMAIN" });
  }
  if (!env.MC_API_KEY) {
    return json(500, { ok:false, error:"missing_MC_API_KEY" });
  }

  // ---- DKIM (ВАЖНО: ключ одной строкой base64 DER!)
  const dkimDomain   = env.DKIM_DOMAIN || SEND_DOMAIN;
  const dkimSelector = env.DKIM_SELECTOR || "";
  const dkimKeyB64   = env.DKIM_PRIVATE_KEY || ""; // одна строка base64, без BEGIN/END

  const dkimEnabled = !!(dkimDomain && dkimSelector && dkimKeyB64);

  // ---- адрес для отладки (получишь дубль письма на этот ящик)
  const BCC_DEBUG = env.BCC_DEBUG ? String(env.BCC_DEBUG).trim() : "";

  // ---- тело письма
  const personal = {
    to: [{ email: SEND_TO }],
    ...(BCC_DEBUG ? { bcc: [{ email: BCC_DEBUG }] } : {}),
    ...(dkimEnabled ? {
      dkim_domain: dkimDomain,
      dkim_selector: dkimSelector,
      dkim_private_key: dkimKeyB64
    } : {})
  };

  // Compose text content
  const textLines = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    company ? `Company: ${company}` : null,
    service ? `Service: ${service}` : null,
    deadline ? `Deadline: ${deadline}` : null,
    '',
    'Message:',
    message
  ].filter(Boolean);

  // Build attachments for MailChannels if any uploaded
  let attachments = [];
  if (uploadedFiles && uploadedFiles.length) {
    const allowed = new Set(['application/pdf','image/jpeg']);
    let total = 0;
    attachments = await Promise.all(
      uploadedFiles.slice(0,3).map(async (file) => {
        const type = file.type || 'application/octet-stream';
        const size = file.size || 0;
        const nameSafe = sanitizeFilename(file.name || 'file');
        if (!allowed.has(type) && !/\.(pdf|jpe?g)$/i.test(nameSafe)) {
          throw new Error('bad_type');
        }
        if (size > 5 * 1024 * 1024) { throw new Error('too_big'); }
        total += size;
        if (total > 10 * 1024 * 1024) { throw new Error('too_big_total'); }
        const ab = await file.arrayBuffer();
        return {
          type,
          filename: nameSafe,
          content: toBase64(ab)
        };
      })
    );
  }

  const mail = {
    personalizations: [ personal ],
    from: { email: `noreply@${SEND_DOMAIN}`, name: FROM_NAME },
    reply_to: REPLY_TO ? { email: REPLY_TO } : undefined,
    subject: `Сообщение с сайта: ${name || "без имени"}`,
    content: [
      { type: "text/plain", value: textLines.join('\n') },
      { type: "text/html",  value: `<pre style="white-space:pre-wrap">${escapeHtml(textLines.join('\n'))}</pre>` }
    ],
    ...(attachments.length ? { attachments } : {})
  };

  // короткая диагностика в лог
  console.log("DKIM cfg:", { enabled: dkimEnabled, d: dkimDomain, s: dkimSelector, keyLen: dkimKeyB64.length, bcc: !!BCC_DEBUG });

  const mcRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Api-Key": env.MC_API_KEY },
    body: JSON.stringify(mail),
  });

  const text = await mcRes.text();
  const mcTrace = mcRes.headers.get("X-Message-Id") || mcRes.headers.get("x-request-id") || null;
  console.log("MailChannels:", mcRes.status, (text || "").slice(0, 200), "trace:", mcTrace);

  if (!mcRes.ok) {
    return json(mcRes.status, { ok:false, error:"mailchannels_failed", status: mcRes.status, text, mcTrace, dkimEnabled });
  }

  return json(200, { ok:true, sent:true, mcStatus: mcRes.status, mcTrace, dkimEnabled });
}

function toBase64(ab){
  let binary='';
  const bytes = new Uint8Array(ab);
  for (let i=0;i<bytes.byteLength;i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function sanitizeFilename(name){
  return (name||'file').replace(/[^\w.\- ]+/g,'_').slice(0,120);
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m])); }

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

