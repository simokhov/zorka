// Зорька. Edge Function get-weather: погода OWM за кэш-таблицей weather_cache.
// TTL: current 30 мин, forecast 3 ч (docs/07-phase1-plan.md, этап 3).
// Ключ OWM — в секретах (supabase secrets set OWM_API_KEY), не в коде.
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SECRET_KEY") ??
  Deno.env.get("SECRET_KEY")!;

const TTL_MIN = { current: 30, forecast: 180 } as const;
const GRID = 0.02;
const OWM_URL = {
  current: (lat: number, lon: number, appid: string) =>
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${appid}`,
  forecast: (lat: number, lon: number, appid: string) =>
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${appid}`,
} as const;

const round = (v: number) => Math.round(v / GRID) * GRID;

export default {
  fetch: async (req: Request): Promise<Response> => {
    try {
      if (req.method !== "POST") {
        return Response.json({ error: "POST only" }, { status: 405 });
      }
      const input = await req.json();
      const lat = round(Number(input.lat));
      const lon = round(Number(input.lon));
      const mode: "current" | "forecast" =
        input.mode === "forecast" ? "forecast" : "current";
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return Response.json({ error: "invalid lat/lon" }, { status: 400 });
      }

      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

      // Горячий кэш.
      const { data: cached } = await admin
        .from("weather_cache")
        .select("payload, fetched_at")
        .eq("lat", lat)
        .eq("lon", lon)
        .eq("mode", mode)
        .maybeSingle();

      if (
        cached &&
        Date.now() - Date.parse(cached.fetched_at) < TTL_MIN[mode] * 60_000
      ) {
        return Response.json({ ...cached.payload, cached: true });
      }

      // Холодный кэш — тянем OWM.
      const appid = Deno.env.get("OWM_API_KEY");
      if (!appid) {
        await admin.from("weather_cache").upsert({
          lat,
          lon,
          mode,
          payload: { stub: true, note: "OWM_API_KEY not configured" },
        });
        return Response.json(
          { error: "OWM_API_KEY not configured" },
          { status: 503 },
        );
      }

      const res = await fetch(OWM_URL[mode](lat, lon, appid));
      if (!res.ok) {
        const detail = await res.text();
        return Response.json(
          { error: "OWM error", status: res.status, detail },
          { status: 502 },
        );
      }
      const payload = await res.json();

      await admin.from("weather_cache").upsert({
        lat,
        lon,
        mode,
        payload,
        fetched_at: new Date().toISOString(),
      });
      return Response.json({ ...payload, cached: false });
    } catch (e) {
      return Response.json({ error: String(e) }, { status: 500 });
    }
  },
};
