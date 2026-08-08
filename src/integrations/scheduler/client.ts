import { createClient } from '@supabase/supabase-js';

const SCHEDULER_URL = 'https://bdslxjkfnziyyqomtzso.supabase.co';
const SCHEDULER_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkc2x4amtmbnppeXlxb210enNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NTY5NDIsImV4cCI6MjA5NDUzMjk0Mn0.FA8ZT_t7Ra4OqQTqW5kvVhRKrihngk1ELCy_WFFjN8s';

// Read-only anon client for the Scheduler project.
// No session persistence: a stale/expired session in localStorage would be sent
// as the Authorization header and make RLS filter out all channel rows.
export const scheduler = createClient(SCHEDULER_URL, SCHEDULER_ANON_KEY, {
  auth: {
    storage: undefined,
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      apikey: SCHEDULER_ANON_KEY,
      Authorization: `Bearer ${SCHEDULER_ANON_KEY}`,
    },
  },
});
