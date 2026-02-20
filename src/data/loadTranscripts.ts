const BASE = import.meta.env.BASE_URL;

export async function loadTranscripts(): Promise<string[]> {
  const res = await fetch(`${BASE}content/healing-online-course/transcripts.txt`);
  const text = await res.text();
  return splitTranscripts(text);
}

export async function loadTranscriptsHe(): Promise<string[]> {
  const res = await fetch(`${BASE}content/healing-online-course/transcripts-he.txt`);
  const text = await res.text();
  return splitTranscripts(text);
}

function splitTranscripts(text: string): string[] {
  const partRegex = /## PART \d+\n\*.*?\*\n\n/g;
  const parts: string[] = [];
  
  const indices: number[] = [];
  let match: RegExpExecArray | null;
  
  while ((match = partRegex.exec(text)) !== null) {
    indices.push(match.index + match[0].length);
  }
  
  const separatorRegex = /\n---\n/g;
  const separators: number[] = [];
  while ((match = separatorRegex.exec(text)) !== null) {
    separators.push(match.index);
  }
  
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i];
    const nextPartStart = i + 1 < indices.length ? indices[i + 1] : text.length;
    const end = separators.find(s => s > start && s < nextPartStart) || nextPartStart;
    parts.push(text.slice(start, end).trim());
  }
  
  return parts.slice(0, 6);
}