import { useState, useEffect } from "react";

const STORAGE_KEY = "country_code";

/** Non-hook helper: returns cached country code or fetches it (caches in sessionStorage). */
export async function getCountryCode(): Promise<string | null> {
  const cached = sessionStorage.getItem(STORAGE_KEY);
  if (cached) return cached;
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data: { country_code?: string } = await res.json();
    const code = data.country_code ?? null;
    if (code) sessionStorage.setItem(STORAGE_KEY, code);
    return code;
  } catch {
    return null;
  }
}

export function useCountryCode() {
  const [countryCode, setCountryCode] = useState<string | null>(
    () => sessionStorage.getItem(STORAGE_KEY),
  );
  const [loading, setLoading] = useState(() => !sessionStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    let cancelled = false;
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data: { country_code?: string }) => {
        if (cancelled) return;
        const code = data.country_code ?? null;
        if (code) sessionStorage.setItem(STORAGE_KEY, code);
        setCountryCode(code);
      })
      .catch(() => {
        if (!cancelled) setCountryCode(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { countryCode, loading };
}
