export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1) Диагностика окружения: https://www.neweee.com/env-check
    if (url.pathname === "/env-check") {
      const data = {
        ok: true,
        host: url.host,
        // Показываем только булевы флаги, без значений
        has_TURNSTILE_SECRET: Boolean(env.TURNSTILE_SECRET),
        has_MC_API_KEY: Boolean(env.MC_API_KEY),
        has_SEND_TO: Boolean(env.SEND_TO),
        has_SEND_DOMAIN: Boolean(env.SEND_DOMAIN),
      };
      return new Response(JSON.stringify(data), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    // 2) (Опционально) Заглушка под API, если понадобится.
    // Если у тебя уже есть рабочая логика (например /api/contact),
    // просто вставь её сюда вместо заглушки.
    if (url.pathname.startsWith("/api/")) {
      return new Response("Not implemented", { status: 404 });
    }

    // 3) По умолчанию — отдаём статические файлы из сборки Pages
    return env.ASSETS.fetch(request);
  }
}
