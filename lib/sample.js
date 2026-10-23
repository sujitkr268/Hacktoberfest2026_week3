/**
 * lib/sample.js
 * -----------------------------------------------------------------------------
 * Curated offline demo content. When someone opens Sloth Digest without an API
 * key (or on a plane), the "Try the sample" buttons fill in a realistic chat
 * log and return a matching pre-built digest — zero network requests.
 */

export const SAMPLE_LOG = `[22:04] Maya: ok hike plans for Saturday are OFFICIALLY happening 🥾
[22:05] Maya: weather says sunny, 22 degrees
[22:06] Dev: I can drive, room for 3 more
[22:07] Ana: I'm in!! need to be back by 4pm though, shift starts at 5
[22:09] Priya: in as well. what time are we meeting?
[22:10] Maya: trailhead at 7:30am sharp. sleepyheads get left behind 🦥
[22:14] Dev: lol we'll see
[22:21] Ana: ALSO who ordered the cake for Sam's birthday?? the bakery needs pickup confirmation by tonight
[22:23] Priya: that was me. I'll call them after dinner
[22:26] Ana: ty 🙏
[22:37] Dev: quick PSA the projector from Sam's place — someone needs to grab it tonight or the movie marathon is cancelled
[22:38] Maya: I'm nowhere near that side of town
[22:40] Priya: me neither :(
[22:41] Dev: You — any chance you can swing by? Sam said leave it at the front desk
[22:52] Maya: found my keys btw, they were under the doormat this whole time
[22:53] Ana: MAYA. we turned the flat upside down on Tuesday 😂
[23:02] Priya: sent a form everyone — workshop feedback for the community meetup. two minutes tops
[23:15] Dev: brb geocaching
[23:40] Ana: 🦥🦥🦥`;

export const SAMPLE_DIGEST = {
  headline: "Saturday hike is ON — and you're on projector duty tonight",
  summary:
    "The group confirmed the 7:30am Saturday hike: Dev is driving with room for three, Ana can stay until 4pm, and Priya is calling the bakery about Sam's birthday cake. One thing needs you — the projector is waiting at Sam's front desk and the movie marathon depends on it.",
  topics: [
    { who: "Maya", what: "Saturday hike confirmed: trailhead 7:30am sharp, sunny and 22°C", emoji: "🥾" },
    { who: "Dev", what: "Driving to the hike, room for 3 more in the car", emoji: "🚗" },
    { who: "Ana", what: "Joining but must be back by 4pm for her shift", emoji: "⏰" },
    { who: "Priya", what: "Handling the bakery pickup confirmation for Sam's birthday cake", emoji: "🎂" },
    { who: "Maya", what: "Found her keys — they were under the doormat all along", emoji: "🔑" },
    { who: "Priya", what: "Shared a 2-minute feedback form for the community meetup", emoji: "📝" },
  ],
  actionItems: [
    {
      task: "Pick up the projector from Sam's front desk tonight",
      owner: "You",
      priority: "high",
      deadline: "Tonight",
    },
    {
      task: "Confirm your seat in Dev's car for the 7:30am hike",
      owner: "You",
      priority: "medium",
      deadline: "Before Saturday",
    },
    {
      task: "Fill in the meetup feedback form (2 minutes)",
      owner: "You",
      priority: "low",
      deadline: "Soon",
    },
  ],
  replies: [
    {
      from: "Dev",
      excerpt: "any chance you can swing by? Sam said leave it at the front desk",
      draft: "On it — grabbing the projector from the front desk tonight and bringing it Saturday! 🎬",
    },
    {
      from: "Priya",
      excerpt: "sent a form everyone — workshop feedback for the community meetup. two minutes tops",
      draft: "Filled it in — great meetup this month!",
    },
  ],
  vibe: "Excited & slightly chaotic 🎉",
  timeSavedMinutes: 16,
};

/**
 * Returns a fresh copy of the curated sample digest (never share references
 * across renders so history entries stay independent).
 */
export function generateSampleDigest() {
  return JSON.parse(JSON.stringify(SAMPLE_DIGEST));
}
