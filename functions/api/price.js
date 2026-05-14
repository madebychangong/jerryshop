import { verifySession } from "../_shared/auth.js";
import { json } from "../_shared/response.js";

const PRICE_KEY = "jerryshop:simple-price-text:v1";

export async function onRequestGet({ env }) {
  const kv = getKV(env);
  if (!kv) return json({ text: "" });
  return json({ text: (await kv.get(PRICE_KEY)) || "" });
}

export async function onRequestPut({ request, env }) {
  if (!(await verifySession(request, env))) {
    return json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const kv = getKV(env);
  if (!kv) {
    return json({ error: "저장할 수 없습니다." }, { status: 400 });
  }

  const body = await request.json();
  const text = String(body.text || "").slice(0, 80_000);
  await kv.put(PRICE_KEY, text);
  return json({ ok: true, text });
}

function getKV(env) {
  return env.JERRY_KV || env.THEBLACK_KV || env.BLACKSHOP_KV || env.KV;
}
