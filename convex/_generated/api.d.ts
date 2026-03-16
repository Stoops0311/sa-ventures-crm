/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityLogs from "../activityLogs.js";
import type * as articles from "../articles.js";
import type * as attendance from "../attendance.js";
import type * as crons from "../crons.js";
import type * as employeeLetters from "../employeeLetters.js";
import type * as employeeProfiles from "../employeeProfiles.js";
import type * as hrMigration from "../hrMigration.js";
import type * as hrQueries from "../hrQueries.js";
import type * as http from "../http.js";
import type * as import_ from "../import.js";
import type * as insurance from "../insurance.js";
import type * as leads from "../leads.js";
import type * as letterTemplates from "../letterTemplates.js";
import type * as lib_activityLogger from "../lib/activityLogger.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_currency from "../lib/currency.js";
import type * as lib_templateResolver from "../lib/templateResolver.js";
import type * as messageTemplates from "../messageTemplates.js";
import type * as messaging from "../messaging.js";
import type * as onboarding from "../onboarding.js";
import type * as payroll from "../payroll.js";
import type * as presence from "../presence.js";
import type * as projectCreatives from "../projectCreatives.js";
import type * as projects from "../projects.js";
import type * as publicSite from "../publicSite.js";
import type * as remarks from "../remarks.js";
import type * as salaryComponents from "../salaryComponents.js";
import type * as stats from "../stats.js";
import type * as suggestions from "../suggestions.js";
import type * as trainingProgress from "../trainingProgress.js";
import type * as trips from "../trips.js";
import type * as users from "../users.js";
import type * as vehicles from "../vehicles.js";
import type * as websiteInquiries from "../websiteInquiries.js";
import type * as whatsappSessions from "../whatsappSessions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityLogs: typeof activityLogs;
  articles: typeof articles;
  attendance: typeof attendance;
  crons: typeof crons;
  employeeLetters: typeof employeeLetters;
  employeeProfiles: typeof employeeProfiles;
  hrMigration: typeof hrMigration;
  hrQueries: typeof hrQueries;
  http: typeof http;
  import: typeof import_;
  insurance: typeof insurance;
  leads: typeof leads;
  letterTemplates: typeof letterTemplates;
  "lib/activityLogger": typeof lib_activityLogger;
  "lib/auth": typeof lib_auth;
  "lib/constants": typeof lib_constants;
  "lib/currency": typeof lib_currency;
  "lib/templateResolver": typeof lib_templateResolver;
  messageTemplates: typeof messageTemplates;
  messaging: typeof messaging;
  onboarding: typeof onboarding;
  payroll: typeof payroll;
  presence: typeof presence;
  projectCreatives: typeof projectCreatives;
  projects: typeof projects;
  publicSite: typeof publicSite;
  remarks: typeof remarks;
  salaryComponents: typeof salaryComponents;
  stats: typeof stats;
  suggestions: typeof suggestions;
  trainingProgress: typeof trainingProgress;
  trips: typeof trips;
  users: typeof users;
  vehicles: typeof vehicles;
  websiteInquiries: typeof websiteInquiries;
  whatsappSessions: typeof whatsappSessions;
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
