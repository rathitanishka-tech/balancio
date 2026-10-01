"use server";

import { getAnalyticsOverview } from "./analytics";

export async function getDashboardOverview() {
  return await getAnalyticsOverview();
}
