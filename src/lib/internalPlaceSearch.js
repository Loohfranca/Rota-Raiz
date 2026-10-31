import { supabase } from "./supabase";
import { createInternalPlaceSearch } from "./internalPlaceSearchRepository";
export { cityAndState, createInternalPlaceSearch } from "./internalPlaceSearchRepository";
// Reuse the current configured client; no second session or external provider.
export const internalPlaceSearch = {
  nearby: (...args) => createInternalPlaceSearch(supabase).nearby(...args),
  completeLegacy: (...args) => createInternalPlaceSearch(supabase).completeLegacy(...args),
  search: (...args) => createInternalPlaceSearch(supabase).search(...args),
  getPlace: (...args) => createInternalPlaceSearch(supabase).getPlace(...args),
  duplicates: (...args) => createInternalPlaceSearch(supabase).duplicates(...args),
};
