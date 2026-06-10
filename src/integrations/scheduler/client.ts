import { createClient } from '@supabase/supabase-js';

export const scheduler = createClient(
  'https://bdslxjkfnziyyqomtzso.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkc2x4amtmbnppeXlxb210enNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NTY5NDIsImV4cCI6MjA5NDUzMjk0Mn0.FA8ZT_t7Ra4OqQTqW5kvVhRKrihngk1ELCy_WFFjN8s'
);
