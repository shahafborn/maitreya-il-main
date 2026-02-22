import { useEffect } from "react";

const DEFAULT_TITLE = "Maitreya Sangha Israel";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
