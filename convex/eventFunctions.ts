import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMyEvents = query({
  args: { profileId: v.id("profiles") },
  returns: v.array(v.object({
    _id: v.id("events"),
    _creationTime: v.number(),
    name: v.string(),
    start_date: v.string(),
    location: v.optional(v.string()),
    created_by: v.id("profiles"),
    creator: v.optional(v.object({
      first_name: v.optional(v.string()),
      last_name: v.optional(v.string()),
    })),
  })),
  handler: async (ctx, args) => {
    // Get event IDs for the current user from event_players
    const playerEvents = await ctx.db
      .query("event_players")
      .filter((q) => q.eq(q.field("player_id"), args.profileId))
      .collect();

    if (playerEvents.length === 0) {
      return [];
    }

    const eventIds = playerEvents.map(pe => pe.event_id);

    // Get all events and filter in memory
    const allEvents = await ctx.db
      .query("events")
      .filter((q) => q.neq(q.field("event_type"), "league"))
      .collect();

    // Filter to only include events the user is part of
    const userEvents = allEvents.filter(event => eventIds.includes(event._id));

    // Sort by start_date
    userEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    // Get creator details for each event
    const eventsWithCreators = await Promise.all(
      userEvents.map(async (event) => {
        const creator = await ctx.db.get(event.created_by);
        return {
          _id: event._id,
          _creationTime: event._creationTime,
          name: event.name,
          start_date: event.start_date,
          location: event.location,
          created_by: event.created_by,
          creator: creator ? {
            first_name: creator.first_name,
            last_name: creator.last_name,
          } : undefined,
        };
      })
    );

    return eventsWithCreators;
  },
});

export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete the event
    await ctx.db.delete(args.eventId);
    
    // Also delete related event_players records
    const eventPlayers = await ctx.db
      .query("event_players")
      .filter((q) => q.eq(q.field("event_id"), args.eventId))
      .collect();
    
    for (const eventPlayer of eventPlayers) {
      await ctx.db.delete(eventPlayer._id);
    }
    
    return null;
  },
}); 