import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Markdown } from "@/site/Markdown";

const GUID = "0b3a6f1e-2c4d-4e5f-8a9b-1c2d3e4f5a6b";

describe("Markdown video embeds", () => {
  it("renders a bare Bunny embed link as the Bunny player, without preloading", () => {
    const { container } = render(
      <Markdown>{`פסקה.\n\nhttps://iframe.mediadelivery.net/embed/782699/${GUID}\n\nעוד פסקה.`}</Markdown>,
    );
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe(
      `https://iframe.mediadelivery.net/embed/782699/${GUID}?autoplay=false&preload=false&responsive=true`,
    );
  });

  it("keeps a captions=<lang> parameter so the player opens with that track on", () => {
    const { container } = render(
      <Markdown>{`https://iframe.mediadelivery.net/embed/782699/${GUID}?captions=he&autoplay=true`}</Markdown>,
    );
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
      `https://iframe.mediadelivery.net/embed/782699/${GUID}?autoplay=false&preload=false&responsive=true&captions=he`,
    );
  });

  it("keeps a t=<seconds> start time", () => {
    const { container } = render(
      <Markdown>{`https://iframe.mediadelivery.net/embed/782699/${GUID}?captions=he&t=2067`}</Markdown>,
    );
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
      `https://iframe.mediadelivery.net/embed/782699/${GUID}?autoplay=false&preload=false&responsive=true&captions=he&t=2067`,
    );
  });

  it("leaves a Bunny link inside a sentence as text", () => {
    const { container } = render(
      <Markdown>{`ראו https://iframe.mediadelivery.net/embed/782699/${GUID} כאן`}</Markdown>,
    );
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("still renders a bare YouTube link as the YouTube player", () => {
    const { container } = render(<Markdown>{"https://youtu.be/RTO-CVqDqJY"}</Markdown>);
    expect(container.querySelector("iframe")?.getAttribute("src")).toContain("youtube-nocookie.com/embed/RTO-CVqDqJY");
  });
});
