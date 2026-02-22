import type { CourseMeeting } from "@/hooks/useCourseContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseScheduleProps {
  meetings: CourseMeeting[];
}

const WEEKDAY_LABELS: Record<string, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

// Target timezones for display
const DISPLAY_ZONES = [
  { tz: "Asia/Jerusalem", label: "Israel" },
  { tz: "America/New_York", label: "New York" },
  { tz: "Europe/London", label: "London" },
  { tz: "Asia/Seoul", label: "Seoul" },
];

/**
 * Convert a canonical local time + timezone to a display time in the target timezone.
 * Uses a reference date (next occurrence of the weekday) to handle DST correctly.
 */
function formatTimeInZone(
  startTime: string,
  sourceTz: string,
  targetTz: string,
  weekday: string
): string {
  // Build a reference date for the next occurrence of this weekday
  const dayIndex = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(weekday);
  const now = new Date();
  const diff = (dayIndex - now.getDay() + 7) % 7 || 7;
  const refDate = new Date(now);
  refDate.setDate(now.getDate() + diff);

  // Parse HH:MM from start_time_local
  const [hours, minutes] = startTime.split(":").map(Number);

  // Create a date string in the source timezone
  const dateStr = refDate.toISOString().split("T")[0];
  const sourceDateTime = new Date(`${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);

  // Use Intl to format in the target timezone
  // We need to first interpret the time in the source timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: targetTz,
  });

  // Create a proper date in the source timezone using Intl
  const sourceFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: sourceTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Get the UTC offset difference by parsing the source time
  const sourceParts = sourceFormatter.formatToParts(sourceDateTime);
  const sourceHour = Number(sourceParts.find((p) => p.type === "hour")?.value ?? 0);
  const offsetHours = hours - sourceHour;
  const adjustedDate = new Date(sourceDateTime.getTime() + offsetHours * 60 * 60 * 1000);

  return formatter.format(adjustedDate);
}

const CourseSchedule = ({ meetings }: CourseScheduleProps) => (
  <section className="py-12 md:py-16 bg-muted/30">
    <div className="container mx-auto px-6 max-w-3xl">
      <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary text-center mb-8">
        Weekly Schedule
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        {meetings.map((meeting) => (
          <Card key={meeting.id} className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {WEEKDAY_LABELS[meeting.weekday] ?? meeting.weekday} &mdash;{" "}
                {meeting.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Multi-timezone display */}
              <div className="space-y-1">
                {DISPLAY_ZONES.map((zone) => (
                  <div
                    key={zone.tz}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{zone.label}</span>
                    <span className="font-medium">
                      {formatTimeInZone(
                        meeting.start_time_local,
                        meeting.timezone,
                        zone.tz,
                        meeting.weekday
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {meeting.duration_minutes && (
                <p className="text-xs text-muted-foreground">
                  Duration: {meeting.duration_minutes} minutes
                </p>
              )}

              {/* Zoom details */}
              {meeting.zoom_join_url && (
                <div className="pt-2 border-t border-border space-y-1">
                  <a
                    href={meeting.zoom_join_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline font-medium"
                  >
                    Join Zoom Meeting
                  </a>
                  {meeting.zoom_meeting_id && (
                    <p className="text-xs text-muted-foreground">
                      Meeting ID: {meeting.zoom_meeting_id}
                    </p>
                  )}
                  {meeting.zoom_passcode && (
                    <p className="text-xs text-muted-foreground">
                      Passcode: {meeting.zoom_passcode}
                    </p>
                  )}
                </div>
              )}

              {/* Note */}
              {meeting.note && (
                <p className="text-sm text-muted-foreground pt-2 border-t border-border">
                  {meeting.note}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default CourseSchedule;
