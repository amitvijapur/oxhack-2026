/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as ingest from "../ingest.js";
import type * as land from "../land.js";
import type * as model_auth from "../model/auth.js";
import type * as model_defaults from "../model/defaults.js";
import type * as model_envelope from "../model/envelope.js";
import type * as model_validators from "../model/validators.js";
import type * as presence from "../presence.js";
import type * as seed from "../seed.js";
import type * as workstreams from "../workstreams.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  health: typeof health;
  http: typeof http;
  ingest: typeof ingest;
  land: typeof land;
  "model/auth": typeof model_auth;
  "model/defaults": typeof model_defaults;
  "model/envelope": typeof model_envelope;
  "model/validators": typeof model_validators;
  presence: typeof presence;
  seed: typeof seed;
  workstreams: typeof workstreams;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
