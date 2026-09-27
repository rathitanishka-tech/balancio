import { Activity, ActivityType, IActivity } from "../models/Activity";

/**
 * Records important group events for the activity feed / audit trail.
 * Not listed as its own controller/route in the original spec, but the
 * spec explicitly asks for "Activity history" as a feature (section 1)
 * and defines the Activity model (section 13), so group.controller.ts
 * exposes a small GET /api/groups/:groupId/activity endpoint backed by
 * this service.
 */
export const activityService = {
  async record(
    groupId: string,
    actorId: string,
    type: ActivityType,
    metadata?: Record<string, unknown>
  ): Promise<IActivity> {
    return Activity.create({ groupId, actorId, type, metadata });
  },

  async listForGroup(groupId: string, limit = 50): Promise<IActivity[]> {
    return Activity.find({ groupId }).sort({ createdAt: -1 }).limit(limit);
  }
};
