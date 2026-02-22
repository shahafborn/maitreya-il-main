import { supabase } from "@/lib/supabase";

/**
 * Track a video recording view via RPC (upsert with daily increment).
 * Silently fails — analytics should never break the user experience.
 */
export async function trackVideoView(recordingId: string, courseId: string) {
  try {
    await supabase.rpc("track_recording_view", {
      _recording_id: recordingId,
      _course_id: courseId,
    });
  } catch {
    // Silently fail
  }
}

/**
 * Track a resource download via RPC (upsert with daily increment).
 */
export async function trackResourceDownload(resourceId: string, courseId: string) {
  try {
    await supabase.rpc("track_resource_download", {
      _resource_id: resourceId,
      _course_id: courseId,
    });
  } catch {
    // Silently fail
  }
}
