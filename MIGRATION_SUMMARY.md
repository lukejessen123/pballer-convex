# Supabase to Convex Migration Summary

## Overview
This document summarizes the migration from Supabase to Convex for the pickleball league management system.

## Files Created/Modified

### 1. New Convex Functions

#### `convex/gameDayFunctions.ts` - NEW
- **Purpose**: Replaces `gameDayService.ts` functionality
- **Functions Created**:
  - `getAssignmentsForGameDay(gameDayId)` - Query to get court assignments for a game day
  - `updateGameDayStatus(gameDayId, status)` - Mutation to update game day status
  - `getGameDay(gameDayId)` - Query to get specific game day details
  - `getAssignmentsWithPlayers(gameDayId)` - Query to get assignments with player details

#### `convex/standingsQueries.ts` - NEW
- **Purpose**: Replaces `standingsService.ts` functionality
- **Functions Created**:
  - `getStandings(leagueId)` - Query to get league standings
  - `getStandingsWithPlayers(leagueId)` - Query to get standings with player details

### 2. New Frontend Services

#### `src/services/gameDayService.ts` - NEW
- **Purpose**: Convex-based replacement for Supabase gameDayService.ts
- **Key Changes**:
  - Uses `useQuery` and `useMutation` hooks instead of Supabase client
  - Real-time data updates automatically
  - Type-safe with TypeScript
  - Includes utility functions and type definitions

#### `src/services/standingsService.ts` - NEW
- **Purpose**: Convex-based replacement for Supabase standingsService.ts
- **Key Changes**:
  - Uses `useQuery` hooks for real-time data
  - Includes utility functions for data processing
  - Type-safe with TypeScript

### 3. Demo Component

#### `src/components/GameDayDemo.tsx` - NEW
- **Purpose**: Demonstrates how to use the new Convex services
- **Features**:
  - Shows game day operations (view assignments, update status)
  - Shows standings operations (view league standings)
  - Interactive demo with form inputs
  - Migration notes and best practices

### 4. Updated App Component

#### `src/App.tsx` - MODIFIED
- **Changes**:
  - Added import for GameDayDemo component
  - Updated Content component to show clubs and demo
  - Removed references to non-existent functions
  - Added migration completion message

## Schema Requirements

Your existing `convex/schema.ts` already contains all necessary tables:

### Required Tables (Already Present):
- `profiles` - User profiles
- `clubs` - Pickleball clubs
- `leagues` - League definitions
- `game_days` - Individual game days
- `court_assignments` - Player assignments to courts
- `standings` - League standings and rankings

### Required Indexes (Already Present):
- `by_game_day` on `court_assignments` table
- `by_league` on `standings` table
- All other necessary indexes for efficient queries

## Migration Benefits

### 1. Real-time Updates
- **Before**: Manual subscription management with Supabase
- **After**: Automatic real-time updates with Convex

### 2. Type Safety
- **Before**: Manual TypeScript types
- **After**: Automatic type generation from schema

### 3. Error Handling
- **Before**: Manual error handling for each query
- **After**: Built-in error handling with Convex

### 4. Performance
- **Before**: Client-side data fetching
- **After**: Optimized server-side queries with caching

## Usage Examples

### Game Day Operations
```typescript
// Get assignments for a game day
const assignments = useAssignmentsForGameDay(gameDayId);

// Update game day status
const updateStatus = useUpdateGameDayStatus();
await updateStatus({ gameDayId, status: "completed" });
```

### Standings Operations
```typescript
// Get league standings
const standings = useStandings(leagueId);

// Get standings with player details
const standingsWithPlayers = useStandingsWithPlayers(leagueId);
```

## Files to Delete

After confirming the migration works:
1. `supabase.ts` - No longer needed
2. `gameDayService.ts` - Replaced by Convex functions
3. `standingsService.ts` - Replaced by Convex functions

## Next Steps

1. **Test the Migration**:
   - Run the application
   - Test game day operations
   - Test standings operations
   - Verify real-time updates work

2. **Data Migration** (if needed):
   - Export data from Supabase
   - Import data into Convex using the existing schema

3. **Update Other Components**:
   - Replace any remaining Supabase client usage
   - Update components to use the new Convex services

4. **Clean Up**:
   - Remove Supabase dependencies from package.json
   - Delete old service files
   - Update documentation

## Troubleshooting

### Common Issues:
1. **Type Errors**: Make sure to import `Id` type from `convex/_generated/dataModel`
2. **Query Errors**: Verify table names and field names match the schema
3. **Real-time Issues**: Ensure components are wrapped in ConvexProvider

### Getting Help:
- Check Convex documentation: https://docs.convex.dev
- Join Convex Discord: https://www.convex.dev/community
- Review the demo component for usage examples 