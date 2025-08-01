import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Query to get user profile
export const getUserProfile = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db.get(userId);
    return profile;
  },
});

// Query to check super admin status
export const getSuperAdminStatus = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, { userId }) => {
    // Get the user profile first
    const profile = await ctx.db.get(userId);
    if (!profile) return false;
    
    // Check if user exists in super_admins table by name
    // Note: This is a simplified check - in production, you might want a different approach
    const superAdmin = await ctx.db
      .query("super_admins")
      .filter((q) => 
        q.and(
          q.eq(q.field("first_name"), profile.first_name),
          q.eq(q.field("last_name"), profile.last_name)
        )
      )
      .first();
    
    return !!superAdmin;
  },
});

// Mutation to sign in (placeholder - replace with your auth system)
export const signIn = mutation({
  args: { 
    email: v.string(),
    password: v.string()
  },
  handler: async (ctx, { email, password }) => {
    // This is a placeholder - in production, you would:
    // 1. Validate credentials with your auth system
    // 2. Create or retrieve user session
    // 3. Return user ID and session data
    
    // For now, we'll simulate a successful login
    // In production, replace this with actual authentication logic
    
    // Find user by email
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!profile) {
      return {
        success: false,
        error: "User not found",
        userId: null
      };
    }
    
    // In production, you would validate the password here
    // For now, we'll assume the password is correct
    
    return {
      success: true,
      error: null,
      userId: profile._id
    };
  },
});

// Mutation to sign up (placeholder - replace with your auth system)
export const signUp = mutation({
  args: { 
    email: v.string(),
    password: v.string(),
    emailRedirectTo: v.optional(v.string())
  },
  handler: async (ctx, { email, password, emailRedirectTo }) => {
    // This is a placeholder - in production, you would:
    // 1. Create user account in your auth system
    // 2. Send verification email if required
    // 3. Create profile record in Convex
    
    // Check if user already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (existingProfile) {
      return {
        success: false,
        error: "User already exists",
        userId: null
      };
    }
    
    // Create new profile
    const profileId = await ctx.db.insert("profiles", {
      email,
      first_name: "",
      last_name: "",
      role: "player",
      active: true,
      auth_id: email as Id<"profiles">, // In production, this would be the auth system's user ID
    });
    
    // In production, you would send verification email here
    
    return {
      success: true,
      error: null,
      userId: profileId
    };
  },
});

// Mutation to sign out (placeholder - replace with your auth system)
export const signOut = mutation({
  args: {},
  handler: async (ctx) => {
    // This is a placeholder - in production, you would:
    // 1. Invalidate session in your auth system
    // 2. Clear any stored tokens
    
    // For now, we'll just return success
    return { success: true };
  },
});

// Query to get current user (for use in other functions)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // This is a placeholder - in production, you would:
    // 1. Get user ID from auth context/session
    // 2. Return user profile
    
    // For now, return null
    return null;
  },
});

// Action to update user profile
export const updateUserProfile = mutation({
  args: {
    userId: v.id("profiles"),
    updates: v.object({
      first_name: v.optional(v.string()),
      last_name: v.optional(v.string()),
      avatar_url: v.optional(v.string()),
      dup_rating: v.optional(v.number()),
      role: v.optional(v.string()),
      active: v.optional(v.boolean()),
    })
  },
  handler: async (ctx, { userId, updates }) => {
    await ctx.db.patch(userId, updates);
    return { success: true };
  },
});

// Query to check if user is admin
export const isUserAdmin = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db.get(userId);
    if (!profile) return false;
    
    // Check if user is super admin by name
    const superAdmin = await ctx.db
      .query("super_admins")
      .filter((q) => 
        q.and(
          q.eq(q.field("first_name"), profile.first_name),
          q.eq(q.field("last_name"), profile.last_name)
        )
      )
      .first();
    
    return (
      profile.role === 'club_admin' ||
      profile.role === 'league_creator' ||
      !!superAdmin
    );
  },
}); 

// Mutation to reset password
export const resetPassword = mutation({
  args: {
    email: v.string(),
    redirectUrl: v.string(),
  },
  handler: async (ctx, { email, redirectUrl }) => {
    // Note: In production, you would integrate with your auth provider
    // For now, this is a placeholder that would send a reset email
    console.log(`Password reset requested for ${email} with redirect to ${redirectUrl}`);
    
    // In a real implementation, you would:
    // 1. Generate a reset token
    // 2. Store it in the database with expiration
    // 3. Send an email with the reset link
    // 4. Handle the reset token verification and password update
    
    // For now, we'll just simulate success
    return { success: true };
  },
}); 

// Mutation to update password
export const updatePassword = mutation({
  args: {
    password: v.string(),
  },
  handler: async (ctx, { password }) => {
    // Note: In production, you would integrate with your auth provider
    // For now, this is a placeholder that would update the user's password
    console.log(`Password update requested`);
    
    // In a real implementation, you would:
    // 1. Verify the current user's session
    // 2. Hash the new password
    // 3. Update the user's password in the auth system
    // 4. Optionally invalidate other sessions
    
    // For now, we'll just simulate success
    return { success: true };
  },
}); 

// Mutation to register user profile
export const registerProfile = mutation({
  args: {
    userId: v.id("profiles"),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, { userId, email, firstName, lastName }) => {
    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, {
        first_name: firstName,
        last_name: lastName,
      });
    } else {
      // Create new profile
      await ctx.db.insert("profiles", {
        email,
        first_name: firstName,
        last_name: lastName,
        role: "player",
        active: true,
        auth_id: userId,
      });
    }
  },
}); 