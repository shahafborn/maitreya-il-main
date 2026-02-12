export async function loadTranscripts(): Promise<string[]> {
  const res = await fetch("/transcripts.txt");
  const text = await res.text();
  
  // Split by "## PART X" headers
  const partRegex = /## PART \d+\n\*Source:.*?\*\n\n/g;
  const parts: string[] = [];
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const indices: number[] = [];
  
  while ((match = partRegex.exec(text)) !== null) {
    indices.push(match.index + match[0].length);
  }
  
  // Find end boundaries (next "---" before next PART, or end of file)
  const separatorRegex = /\n---\n/g;
  const separators: number[] = [];
  while ((match = separatorRegex.exec(text)) !== null) {
    separators.push(match.index);
  }
  
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i];
    // Find the next separator that comes after this part's start
    // but before the next part's header
    const nextPartStart = i + 1 < indices.length ? indices[i + 1] : text.length;
    const end = separators.find(s => s > start && s < nextPartStart) || nextPartStart;
    parts.push(text.slice(start, end).trim());
  }
  
  return parts.slice(0, 6);
}
