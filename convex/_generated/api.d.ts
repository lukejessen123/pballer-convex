/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as adminActions from "../adminActions.js";
import type * as adminFunctions from "../adminFunctions.js";
import type * as auth from "../auth.js";
import type * as authFunctions from "../authFunctions.js";
import type * as clubFunctions from "../clubFunctions.js";
import type * as emailActions from "../emailActions.js";
import type * as eventFunctions from "../eventFunctions.js";
import type * as gameDayFunctions from "../gameDayFunctions.js";
import type * as http from "../http.js";
import type * as leagueFunctions from "../leagueFunctions.js";
import type * as myFunctions from "../myFunctions.js";
import type * as paymentFunctions from "../paymentFunctions.js";
import type * as playFunctions from "../playFunctions.js";
import type * as playerFunctions from "../playerFunctions.js";
import type * as standingsFunctions from "../standingsFunctions.js";
import type * as standingsQueries from "../standingsQueries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  adminActions: typeof adminActions;
  adminFunctions: typeof adminFunctions;
  auth: typeof auth;
  authFunctions: typeof authFunctions;
  clubFunctions: typeof clubFunctions;
  emailActions: typeof emailActions;
  eventFunctions: typeof eventFunctions;
  gameDayFunctions: typeof gameDayFunctions;
  http: typeof http;
  leagueFunctions: typeof leagueFunctions;
  myFunctions: typeof myFunctions;
  paymentFunctions: typeof paymentFunctions;
  playFunctions: typeof playFunctions;
  playerFunctions: typeof playerFunctions;
  standingsFunctions: typeof standingsFunctions;
  standingsQueries: typeof standingsQueries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
