// src/controllers/userController.js
const jwt = require('jsonwebtoken');
const { getUserAppRole } = require('../middleware/auth');

// GET /api/users/me
async function getMe(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
    return;
  }
  const token = authHeader.split(' ')[1];
  let userId;
  try {
    const decoded = jwt.decode(token);
    userId = decoded?.sub;
    if (!userId) throw new Error('No sub in JWT');
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Invalid token' });
    return;
  }
  try {
    const userProfile = await getUserAppRole(userId);
    if (!userProfile) {
      reply.code(404).send({ error: 'Not Found', message: 'User profile not found' });
      return;
    }
    reply.send({ profile: userProfile });
  } catch (err) {
    reply.code(500).send({ error: 'Internal Server Error', message: 'Failed to fetch user profile' });
  }
}

module.exports = { getMe };
