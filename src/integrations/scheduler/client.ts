import { createClient } from '@supabase/supabase-js';

export const scheduler = createClient(
  'https://bdslxjkfnziyyqomtzso.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkc2x4amtmbnppeXlxb210enNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNjM2NzcsImV4cCI6MjA2MjYzOTY3N30'
);
