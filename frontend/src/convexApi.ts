import { anyApi } from "convex/server";
import type { api as BackendApi, internal as BackendInternal } from "../../backend/convex/_generated/api";

export const api = anyApi as unknown as BackendApi;
export const internal = anyApi as unknown as BackendInternal;


