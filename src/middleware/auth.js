// middleware/auth.js
const supabase = require('../config/supabaseClient');
const jwt = require('jsonwebtoken');

// Function to get the application role from your custom Users table
async function getUserAppRole(authUserId) {
  if (!authUserId) return null;

  try {
    // *** IMPORTANT: Adapt this query ***
    // Assumes your 'Users' table has a column 'auth_user_id' that stores the Supabase Auth UID (uuid)
    // and a 'role' column that is a foreign key to RoleTypes.id
    const { data: userData, error: userError } = await supabase
      .from('Users')
      .select(`
        id,
        email,
        role ( id, role_type )
      `)
      .eq('supabase_uid', authUserId) // Match based on Supabase Auth UID
      .single();

    if (userError) {
      console.error('Error fetching user role:', userError.message);
      return null;
    }

    if (userData && userData.role) {
      return {
        appUserId: userData.id, // Your application's internal User ID
        email: userData.email,
        roleId: userData.role.id,
        roleType: userData.role.role_type,
      };
    }
    return null;
  } catch (err) {
    console.error('Exception fetching user role:', err);
    return null;
  }
}


async function verifyAdmin(request, reply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
    return; // Important to stop execution
  }

  const token = authHeader.split(' ')[1];

  try {
    let userId;
    try {
      const decoded = jwt.decode(token);
      userId = decoded.sub; // Supabase user ID is in the 'sub' claim
    } catch (err) {
      console.warn('JWT decode failed:', err.message);
      reply.code(401).send({ error: 'Unauthorized', message: 'Invalid token' });
      return;
    }

    // Now check the role in *your* database
    const userAppProfile = await getUserAppRole(userId); // userId is the Supabase Auth UID

    if (!userAppProfile || userAppProfile.roleType !== 'Admin') {
       console.warn(`User ${userAppProfile.email} (ID: ${userId}) is not an Admin. Role: ${userAppProfile?.roleType}`);
      reply.code(403).send({ error: 'Forbidden', message: 'User does not have Admin privileges' });
      return;
    }

    // Attach user info (including app-specific ID and role) to the request for controllers/services
    request.user = {
      auth_id: userId, // Supabase Auth ID
      app_id: userAppProfile.appUserId, // Your User table ID
      email: userAppProfile.email,
      role: userAppProfile.roleType,
    };

    // Proceed to the next handler/route
     // No need to call done() or next() explicitly in Fastify middleware unless using hooks like onRequest

  } catch (error) {
    console.error('Error during admin verification:', error);
    reply.code(500).send({ error: 'Internal Server Error', message: 'An error occurred during authentication check' });
  }
}

module.exports = { verifyAdmin, getUserAppRole }; // Export helper if needed elsewhere