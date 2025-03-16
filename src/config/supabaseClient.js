// config/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL and Service Key must be defined in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = supabase;