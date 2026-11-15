export const snapshotDate = "2026-11-15";
export const appStoreUrl = "https://apps.apple.com/us/app/golf-tracer-sky-trace/id6822137424";

export const liveListing = {
  title: "Golf Tracer: Sky Trace",
  subtitle: "Golf Ball Tracer & Shot Video",
  version: "1.8.0"
};

export const appleSources = {
  search: "https://developer.apple.com/app-store/search/",
  information: "https://developer.apple.com/help/app-store-connect/reference/app-information/app-information",
  keywords: "https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information"
};

const description = "Add a ball-flight tracer to your golf swing video and replay the same shot over the real hole in 3D.\n\nStart with Auto Track or place the impact and landing points yourself. Adjust the arc and style, then save the result to Photos. Revisit a drive, approach, or putt with one clip.\n\nSkyTrace Pro unlocks 3D split-screen exports, the corner map, score overlays, all tracer styles, and full-resolution export without the SkyTrace tag.";

export const ideas = [
  {
    id: "swing",
    name: "Keep the live title, test swing intent",
    title: liveListing.title,
    subtitle: "Ball Flight & Swing Video",
    keywords: "tracking,shot,trajectory,auto track,manual,draw,fade,putt,overlay,3d flyover,scorecard",
    description,
    hypothesis: "The subtitle adds “swing” while the title keeps the strongest exact phrase. Watch golf swing tracer and check that golf ball tracer holds."
  },
  {
    id: "shot",
    name: "Test shot tracer in the title",
    title: "Golf Shot Tracer: Sky Trace",
    subtitle: "Ball Flight & Swing Video",
    keywords: "tracking,trajectory,auto track,manual,draw,fade,putt,overlay,3d flyover,scorecard",
    description,
    hypothesis: "A later test can target shot-tracing intent in the title. Check golf tracer for any drop after moving those words apart."
  }
];

export const competitors = [
  {
    name: "Shot Tracer",
    subtitle: "#1 Golf Ball & 3D Map Tracing",
    rating: "3.0",
    count: "4",
    price: "$5.99 · In-app purchases",
    positioning: "Broadcast-style editing, live tracing, and 3D map flyovers.",
    takeaway: "Show Auto Track working on an imported swing clip and make the free and Pro export options clear.",
    url: "https://apps.apple.com/us/app/shot-tracer/id1140451547"
  },
  {
    name: "SmoothSwing",
    subtitle: "Golf Shot Tracer & Golf GPS",
    rating: "4.8",
    count: "12K",
    price: "Free · In-app purchases",
    positioning: "Real-time shot tracing paired with on-course GPS tools.",
    takeaway: "Keep tracking copy specific to the ball in a swing video. Use the 3D replay to show the actual workflow.",
    url: "https://apps.apple.com/us/app/smoothswing/id1514586439"
  },
  {
    name: "The Golf Tracer",
    subtitle: "#1 Rated Tracer App!",
    rating: "3.8",
    count: "1.6K",
    price: "Free · In-app purchases",
    positioning: "Manual tracing, style options, yardage labels, and swing sequences.",
    takeaway: "Show automatic tracing first, then show how users can adjust the impact, arc, and landing by hand.",
    url: "https://apps.apple.com/us/app/the-golf-tracer/id1330717186"
  }
];

export const priorities = ["Core", "High", "Explore"];
export const keywordStatuses = ["Queued", "Testing", "Watching", "Paused"];
export const taskStatuses = ["To do", "In progress", "Done"];
export const taskCategories = ["Screenshots", "Description", "Metadata"];
export const releaseStatuses = ["Planned", "Live"];
export const outcomes = ["Pending", "Improved", "Flat", "Declined", "Mixed"];
export const devices = ["iPhone", "iPad"];

export const seed = {
  schema: 1,
  draft: { title: ideas[0].title, subtitle: ideas[0].subtitle, keywords: ideas[0].keywords, description },
  keywords: [
    { id: "golf-tracer", term: "golf tracer", priority: "Core", status: "Testing", hypothesis: "The live title starts with this phrase. Use it as the primary benchmark." },
    { id: "golf-swing-tracer", term: "golf swing tracer", priority: "High", status: "Queued", hypothesis: "Test a subtitle that uses swing while keeping the current title." },
    { id: "golf-ball-tracer", term: "golf ball tracer", priority: "High", status: "Testing", hypothesis: "The live subtitle uses this phrase. Check it before and after any subtitle change." },
    { id: "golf-tracking", term: "golf tracking", priority: "Explore", status: "Queued", hypothesis: "This search can mean GPS, scoring, or shot tracking. Check whether the results actually match video-based ball tracking." }
  ],
  versions: [
    {
      id: "v180", version: "1.8.0", status: "Live", date: "",
      title: liveListing.title, subtitle: liveListing.subtitle, keywords: "",
      changes: "Public release notes describe 3D landing placement and zoom fixes. Captured the live U.S. title and subtitle on November 15 as the metadata baseline.",
      outcome: "Pending", evidence: "Record the first rank checks. The live keyword field is available in App Store Connect."
    },
    {
      id: "v170", version: "1.7.0", status: "Live", date: "",
      title: "", subtitle: "", keywords: "",
      changes: "Public release notes describe more natural automatic and hand-shaped ball flights.",
      outcome: "Pending", evidence: ""
    },
    {
      id: "v162", version: "1.6.2", status: "Live", date: "",
      title: "", subtitle: "", keywords: "",
      changes: "Public release notes describe manual trajectory fixes and clearer Pro messaging.",
      outcome: "Pending", evidence: ""
    }
  ],
  tasks: [
    { id: "hero-shot", name: "Show a traced ball flight in screenshot 1", category: "Screenshots", status: "To do", versionId: "", notes: "Use an actual down-the-line shot with a clearly visible tracer. Test the caption “See your ball flight.” Read it at App Store search size." },
    { id: "flyover-shot", name: "Show the same shot in 3D", category: "Screenshots", status: "To do", versionId: "", notes: "Put the split-screen flyover high in the gallery. Use the same clip as screenshot 1 so the replay is easy to recognize." },
    { id: "manual-shot", name: "Show Auto Track and manual adjustments", category: "Screenshots", status: "To do", versionId: "", notes: "Use a real editor capture showing the manual arc or landing controls. Keep button labels legible at thumbnail size." },
    { id: "description", name: "Rewrite the description opening and Pro terms", category: "Description", status: "To do", versionId: "", notes: "Lead with the tracer and 3D replay. Read the draft aloud and verify the free and Pro export details against the shipping build." },
    { id: "keywords", name: "Record the live keyword field", category: "Metadata", status: "To do", versionId: "v180", notes: "Copy the U.S. English keyword field from App Store Connect into the 1.8.0 release entry before changing it." }
  ],
  checks: [],
  ratings: [
    { id: "public-baseline", date: snapshotDate, store: "US", versionId: "v180", average: 4.3, count: 6, notes: "Public U.S. App Store product page snapshot." }
  ]
};
