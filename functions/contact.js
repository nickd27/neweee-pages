export async function onRequestPost({ request, env }) {
  try {
    // 1) считаем данные формы
    const form = await request.formData();
    const name = (form.get("name") || "").toString().trim();
    const email = (form.get("email") || "").toString().trim();
    const message = (form.get("message") || "").toString().trim();

    // 2) токен Turnstile
    const token = form.get("cf-turnstile-response");
    if (!token) {
      return json(400, { ok: false, error: "turnstile_token_missing" });
    }

    // 3) серверная верификация Turnstile
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token,
        // Можно добавить: remoteip: (новее не обязательно)
      }),
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      // Полезно залогировать коды ошибок
      console.log("Turnstile failed:", verifyData["error-codes"]);
      return json(400, { ok: false, error: "turnstile_failed", details: verifyData["error-codes"] });
    }

    // 4) отправка через MailChannels
    const SEND_TO = env.SEND_TO office@neweee.com;           // например, info@neweee.com
    const SEND_DOMAIN = env.SEND_neweee.com;   // например, neweee.com
    const FROM_NAME = env.FROM_neweee.com || "Website Contact";
    const REPLY_TO = email || env.REPLY_TO || "";

    const mail = {
      personalizations: [{ to: [{ email: SEND_TO }] }],
      from: { email: `noreply@neweee.com}`, name: FROM_NAME },
      subject: `Сообщение с сайта: ${neweee.com || "без имени"}`,
      content: [{ type: "text/plain", value: `От: ${name}\nEmail: ${email}\n\n${message}` }],
      headers: REPLY_TO ? { "Reply-To": REPLY_TO } : undefined,
    };

    const mcRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mail),
    });

    if (!mcRes.ok) {
      const text = await mcRes.text();
      console.log("MailChannels error:", mcRes.status, text);
      return json(502, { ok: false, error: "mailchannels_failed", status: mcRes.status, text });
    }

    return json(200, { ok: true, sent: true });
  } catch (e) {
    console.log("Handler error:", e);
    return json(500, { ok: false, error: "server_error" });
  }
}

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
