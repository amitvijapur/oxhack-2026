import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily("remove unreferenced run payloads", { hourUTC: 4, minuteUTC: 0 }, internal.ingest.cleanupOrphanPayloads, {});

export default crons;
