export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      if (url.pathname === "/env-check" && request.method === "GET") {
        return new Response(JSON.stringify({
          ok: true,
          host: url.hostname,
          has_TURNSTILE_SECRET_PAGES: !!env.TURNSTILE_SECRET_PAGES,
          has_TURNSTILE_SECRET_PROD:  !!env.TURNSTILE_SECRET_PROD,
          has_MC_API_KEY: !!env.MC_API_KEY,
          SEND_TO: env.SEND_TO || null,
          SEND_DOMAIN: env.SEND_DOMAIN || null
        }), { headers: { "content-type": "application/json; charset=utf-8" }});
      }

      if (url.pathname === "/contact" && request.method === "POST") {
        try {
          const ct = request.headers.get("content-type") || "";
          let name="", email="", message="", token="", phone="", company="", service="", deadline="";
          let uploadedFiles = [];

          if (ct.includes("application/x-www-form-urlencoded")) {
            const bodyText = await request.text();
            const p = new URLSearchParams(bodyText);
            name = (p.get("name") || "").trim();
            email = (p.get("email") || "").trim();
            message = (p.get("message") || "").trim();
            phone = (p.get("phone") || "").trim();
            company = (p.get("company") || "").trim();
            service = (p.get("service") || "").trim();
            deadline = (p.get("deadline") || "").trim();
            token = p.get("cf-turnstile-response") || "";
          } else if (ct.includes("multipart/form-data")) {
            const form = await request.formData();
            name = (form.get("name") || "").toString().trim();
            email = (form.get("email") || "").toString().trim();
            message = (form.get("message") || "").toString().trim();
            phone = (form.get("phone") || "").toString().trim();
            company = (form.get("company") || "").toString().trim();
            service = (form.get("service") || "").toString().trim();
            deadline = (form.get("deadline") || "").toString().trim();
            token = form.get("cf-turnstile-response") || "";
            uploadedFiles = form.getAll("files").filter(f => f && typeof f.name === "string");
          } else {
            return json(415, { ok:false, error:"unsupported_content_type" });
          }

          if (!token) return json(400, { ok:false, error:"turnstile_token_missing" });

          // pick Turnstile secret
          const host = url.hostname;
          const secret =
            host.endsWith("neweee-pages.pages.dev") ? (env.TURNSTILE_SECRET_PAGES || env.TURNSTILE_SECRET)
          : (host === "neweee.com" || host === "www.neweee.com") ? (env.TURNSTILE_SECRET_PROD || env.TURNSTILE_SECRET)
          : (env.TURNSTILE_SECRET || "");

          const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ secret, response: token }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success) {
            return json(400, { ok:false, error:"turnstile_failed", details: verifyData["error-codes"] });
          }

          return await sendMail(env, { name, email, message, phone, company, service, deadline, uploadedFiles });

        } catch (e) {
          console.log("Contact handler error:", e.stack || e);
          return json(500, { ok:false, error:"server_error", details: String(e) });
        }
      }

      return env.ASSETS.fetch(request);

    } catch (e) {
      return new Response(JSON.stringify({ ok:false, error:"unhandled", details: String(e) }), {
        status: 500, headers: { "content-type": "application/json; charset=utf-8" }
      });
    }
  }
}

async function sendMail(env, { name, email, message, phone="", company="", service="", deadline="", uploadedFiles=[] }) {
  const SEND_TO = env.SEND_TO || "office@neweee.com";
  const SEND_DOMAIN = env.SEND_DOMAIN || "neweee.com";
  const FROM_NAME = env.FROM_NAME || "Neweee";
  const REPLY_TO = email || env.REPLY_TO || "";

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
        if (total > 15 * 1024 * 1024) { throw new Error('too_big_total'); }
        const ab = await file.arrayBuffer();
        return {
          type,
          filename: nameSafe,
          content: toBase64(ab)
        };
      })
    );
  }

  const payload = {
    personalizations: [{ to: [{ email: SEND_TO }] }],
    from: { email: `noreply@${SEND_DOMAIN}`, name: FROM_NAME },
    ...(REPLY_TO ? { reply_to: { email: REPLY_TO } } : {}),
    subject: `Сообщение с сайта: ${name || "без имени"}`,
    content: [
      { type: "text/plain", value: textLines.join('\n') },
      { type: "text/html",  value: `<pre style="white-space:pre-wrap">${escapeHtml(textLines.join('\n'))}</pre>` }
    ],
    ...(attachments.length ? { attachments } : {})
  };

  const headers = { "content-type": "application/json" };
  if (env.MC_API_KEY) headers["X-Api-Key"] = env.MC_API_KEY;

  const mcRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await mcRes.text();
  const mcTrace = mcRes.headers.get("X-Message-Id") || mcRes.headers.get("x-request-id") || null;
  console.log("MailChannels:", mcRes.status, (text || "").slice(0, 200), "trace:", mcTrace);

  if (!mcRes.ok) {
    return json(mcRes.status, { ok:false, error:"mailchannels_failed", status: mcRes.status, text, mcTrace });
  }

  return json(200, { ok:true, sent:true, mcStatus: mcRes.status, mcTrace });
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

