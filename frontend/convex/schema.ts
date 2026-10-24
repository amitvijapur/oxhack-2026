import { defineSchema } from "convex/server";

// No tables yet: the evidence snapshot stays static in public/data/.
// Each workstream (land/contracts, MiroFish, decision engine) adds its own
// table here once its output shape is agreed. See convex/README.md.
export default defineSchema({});
