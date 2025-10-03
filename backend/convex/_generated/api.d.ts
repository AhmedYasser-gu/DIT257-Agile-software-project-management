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
import type * as crons from "../crons.js";
import type * as functions_claimDonation from "../functions/claimDonation.js";
import type * as functions_createDonation from "../functions/createDonation.js";
import type * as functions_createUser from "../functions/createUser.js";
import type * as functions_expireDonations from "../functions/expireDonations.js";
import type * as functions_getAllDonors from "../functions/getAllDonors.js";
import type * as functions_listAvailableDonations from "../functions/listAvailableDonations.js";
import type * as functions_listMyClaims from "../functions/listMyClaims.js";
import type * as functions_listMyDonations from "../functions/listMyDonations.js";
import type * as functions_uploadImage from "../functions/uploadImage.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  "functions/claimDonation": typeof functions_claimDonation;
  "functions/createDonation": typeof functions_createDonation;
  "functions/createUser": typeof functions_createUser;
  "functions/expireDonations": typeof functions_expireDonations;
  "functions/getAllDonors": typeof functions_getAllDonors;
  "functions/listAvailableDonations": typeof functions_listAvailableDonations;
  "functions/listMyClaims": typeof functions_listMyClaims;
  "functions/listMyDonations": typeof functions_listMyDonations;
  "functions/uploadImage": typeof functions_uploadImage;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
