import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Query to get clubs for a user (clubs they created or are admin of)
export const getUserClubs = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    // Get clubs where user is the creator
    const createdClubs = await ctx.db
      .query("clubs")
      .withIndex("by_created_by", (q) => q.eq("created_by", profileId))
      .collect();
    
    // Get all clubs and filter for admin membership using in-memory filtering
    const allClubs = await ctx.db.query("clubs").collect();
    const adminClubs = allClubs.filter(club => 
      club.admins && club.admins.includes(profileId)
    );
    
    // Combine and deduplicate
    const allUserClubs = [...createdClubs, ...adminClubs];
    const uniqueClubs = allUserClubs.filter((club, index, self) => 
      index === self.findIndex(c => c._id === club._id)
    );
    
    return uniqueClubs;
  },
});

// Query to get a specific club by ID
export const getClubById = query({
  args: { clubId: v.id("clubs") },
  handler: async (ctx, { clubId }) => {
    const club = await ctx.db.get(clubId);
    return club;
  },
});

// Mutation to create a new club
export const createClub = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    location: v.string(),
    createdBy: v.id("profiles"),
    admins: v.array(v.id("profiles")),
  },
  handler: async (ctx, { name, description, location, createdBy, admins }) => {
    const clubId = await ctx.db.insert("clubs", {
      name,
      description,
      location,
      created_by: createdBy,
      admins,
    });
    
    return clubId;
  },
});

// Mutation to update a club
export const updateClub = mutation({
  args: {
    clubId: v.id("clubs"),
    name: v.string(),
    description: v.optional(v.string()),
    location: v.string(),
    admins: v.array(v.id("profiles")),
  },
  handler: async (ctx, { clubId, name, description, location, admins }) => {
    await ctx.db.patch(clubId, {
      name,
      description,
      location,
      admins,
    });
  },
});

// Mutation to delete a club
export const deleteClub = mutation({
  args: { clubId: v.id("clubs") },
  handler: async (ctx, { clubId }) => {
    await ctx.db.delete(clubId);
  },
}); 