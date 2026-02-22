import { useEffect } from "react";

const DEFAULT_TITLE = "מאיטרייה סנגהה ישראל";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
