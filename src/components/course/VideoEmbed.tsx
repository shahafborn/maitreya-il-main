import { AspectRatio } from "@/components/ui/aspect-ratio";

interface VideoEmbedProps {
  embedType: "bunny" | "youtube" | "iframe";
  embedUrl: string;
  title?: string;
  onLoad?: () => void;
}

// Allowed embed domains for security
const ALLOWED_DOMAINS = [
  "iframe.mediadelivery.net",  // bunny.net
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
];

function isAllowedUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

const VideoEmbed = ({ embedType, embedUrl, title, onLoad }: VideoEmbedProps) => {
  // For bunny/youtube, construct the proper embed URL if needed
  let src = embedUrl;

  if (embedType === "youtube" && !embedUrl.includes("embed")) {
    // Convert watch URL to embed: https://www.youtube.com/watch?v=ID → embed/ID
    const match = embedUrl.match(/(?:v=|youtu\.be\/)([\w-]+)/);
    if (match) {
      src = `https://www.youtube-nocookie.com/embed/${match[1]}`;
    }
  }

  if (!isAllowedUrl(src)) {
    return (
      <div className="bg-muted rounded-lg p-4 text-center text-muted-foreground text-sm">
        Video unavailable (unsupported source)
      </div>
    );
  }

  return (
    <AspectRatio ratio={16 / 9}>
      <iframe
        src={src}
        title={title ?? "Video"}
        className="w-full h-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        onLoad={onLoad}
      />
    </AspectRatio>
  );
};

export default VideoEmbed;
