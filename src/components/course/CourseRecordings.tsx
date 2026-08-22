import { useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { CourseRecording } from "@/hooks/useCourseContent";
import VideoEmbed from "@/components/course/VideoEmbed";
import { trackVideoView } from "@/lib/analytics";

interface CourseRecordingsProps {
  recordings: CourseRecording[];
  courseId: string;
}

const SESSION_LABELS: Record<string, string> = {
  main: "Main Teaching",
  clarification: "Clarification Session",
};

const CourseRecordings = ({ recordings, courseId }: CourseRecordingsProps) => {
  // Deduplicate tracking per session (prevent re-renders from spamming)
  const trackedRef = useRef<Set<string>>(new Set());

  const handleVideoLoad = (recordingId: string) => {
    if (trackedRef.current.has(recordingId)) return;
    trackedRef.current.add(recordingId);
    trackVideoView(recordingId, courseId);
  };

  // Group recordings by week_number (null = ungrouped)
  const grouped = new Map<number | null, CourseRecording[]>();
  for (const rec of recordings) {
    const key = rec.week_number;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(rec);
  }

  // Sort week keys descending (latest week first, null last)
  const weeks = [...grouped.keys()].sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return b - a;
  });

  // A course with no week numbers at all (an ongoing practice rather than a
  // numbered series) has nothing to group BY, so the accordion would wrap every
  // recording in a single meaningless "Additional Recordings" drawer. Render a
  // plain list instead - the titles already carry the date.
  const ungrouped = weeks.length === 1 && weeks[0] === null;

  const RecordingItem = ({ rec }: { rec: CourseRecording }) => (
    <div>
      <h4 className="text-sm font-medium text-foreground mb-2">
        {rec.title}
        {rec.session_type && (
          <span className="ml-2 text-xs text-muted-foreground">
            ({SESSION_LABELS[rec.session_type] ?? rec.session_type})
          </span>
        )}
      </h4>
      <VideoEmbed
        embedType={rec.embed_type}
        embedUrl={rec.embed_url}
        title={rec.title}
        onLoad={() => handleVideoLoad(rec.id)}
      />
    </div>
  );

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary text-center mb-8">
          Recordings
        </h2>

        {recordings.length === 0 ? (
          <p className="text-center text-muted-foreground italic">
            Session recordings will appear here as they are added.
          </p>
        ) : ungrouped ? (
          <div className="space-y-8">
            {grouped.get(null)!.map((rec) => (
              <RecordingItem key={rec.id} rec={rec} />
            ))}
          </div>
        ) : (
        <Accordion type="multiple" defaultValue={weeks.map((w) => String(w))} className="w-full">
          {weeks.map((week) => {
            const recs = grouped.get(week)!;
            const label =
              week !== null ? `Week ${week}` : "Additional Recordings";

            return (
              <AccordionItem key={String(week)} value={String(week)}>
                <AccordionTrigger className="text-lg font-heading font-semibold">
                  {label}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-2">
                    {recs.map((rec) => (
                      <RecordingItem key={rec.id} rec={rec} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        )}
      </div>
    </section>
  );
};

export default CourseRecordings;
