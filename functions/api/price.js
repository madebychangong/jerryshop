import { verifySession } from "../_shared/auth.js";
import { json } from "../_shared/response.js";

const PRICE_KEY = "jerryshop:simple-price-text:v1";

export async function onRequestGet({ env }) {
  const kv = getKV(env);
  if (!kv) return json({ text: "", settings: {} });

  return json(readRecord((await kv.get(PRICE_KEY)) || ""));
}

export async function onRequestPut({ request, env }) {
  if (!(await verifySession(request, env))) {
    return json({ error: "Login required." }, { status: 401 });
  }

  const kv = getKV(env);
  if (!kv) {
    return json({ error: "Storage unavailable." }, { status: 400 });
  }

  const current = readRecord((await kv.get(PRICE_KEY)) || "");
  const body = await request.json();
  const text = String(body.text ?? current.text ?? "").slice(0, 80_000);
  const settings = sanitizeSettings({
    ...(current.settings || {}),
    ...(body.settings || {})
  });
  const record = {
    text,
    settings,
    updatedAt: new Date().toISOString()
  };

  await kv.put(PRICE_KEY, JSON.stringify(record));
  return json({ ok: true, text, settings });
}

function getKV(env) {
  return env.JERRY_KV;
}

function readRecord(value) {
  if (!value) return { text: "", settings: {} };

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return {
        text: String(parsed.text || ""),
        settings: sanitizeSettings(parsed.settings || {})
      };
    }
  } catch {}

  return { text: String(value), settings: {} };
}

function sanitizeSettings(settings) {
  return {
    notice: clean(settings.notice, 500),
    kakaoOneUrl: clean(settings.kakaoOneUrl, 500),
    kakaoGroupUrl: clean(settings.kakaoGroupUrl, 500)
  };
}

function clean(value, limit) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}
