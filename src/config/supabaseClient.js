// config/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL and Service Key must be defined in environment variables');
}

// Create client with optimized options for serverless
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false
  },
  // Set a reasonable timeout for the entire request
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        // Set a 10-second timeout to prevent hanging connections
        signal: AbortSignal.timeout(10000) // 10 seconds timeout
      });
    }
  },
  db: {
    schema: 'public'
  },
  // Add retry options to help with intermittent failures
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

module.exports = supabase;