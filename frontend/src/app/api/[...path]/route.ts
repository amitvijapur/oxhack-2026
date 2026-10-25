import { handle } from "@/server/router.js";

// Every /api request goes through one route table (src/server/routes.js), so
// one function serves the whole API and `node --test` can exercise it directly.
export const dynamic = "force-dynamic";

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
