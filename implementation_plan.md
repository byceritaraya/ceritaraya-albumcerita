# Sprint 2B: Contributor Identity

The goal of this sprint is to track guest identity when they join an event. This allows us to attribute future photo uploads to the correct contributor.

## SQL Migration

Please run the following SQL script in your Supabase SQL Editor. 

> [!IMPORTANT]
> Do this **before** approving this plan, as the subsequent application changes rely on this table.

```sql
-- Create contributors table
CREATE TABLE contributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups by event
CREATE INDEX idx_contributors_event_id ON contributors(event_id);
```

## User Review Required

Please execute the SQL migration above in Supabase and confirm when you are ready to proceed.

## Proposed Changes

Once you approve, I will implement the following changes:

### Join Page (`src/app/join/page.tsx` & `src/app/join/actions.ts`)

- Add a "Your Name" input field to the Join Event form.
- Modify `joinEvent` action to:
  - Extract and validate the `display_name` from the form data.
  - Insert a new record into the `contributors` table after verifying the PIN.
  - Set a `contributor_id` secure cookie (httpOnly, sameSite strict) pointing to the newly created `contributors.id`.

### Event Detail Page (`src/app/event/[eventId]/page.tsx`)

- Read the `contributor_id` cookie.
- Fetch the contributor's details from the database using the cookie value.
- Display a greeting like "Welcome, [display_name]!" or update the existing welcome message to include their name.
- If the cookie is missing or invalid, potentially redirect the user back to `/join`.

## Verification Plan

### Manual Verification
- Join an event providing a Display Name.
- Verify that a record is created in the `contributors` table.
- Verify the event page shows the provided name.
