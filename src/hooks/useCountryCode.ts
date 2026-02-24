import { useState, useEffect } from "react";

const STORAGE_KEY = "country_code";

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
