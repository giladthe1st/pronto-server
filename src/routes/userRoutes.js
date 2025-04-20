// src/routes/userRoutes.js
const { getMe } = require('../controllers/userController');

module.exports = async function (fastify, opts) {
  fastify.get('/me', getMe); // /api/users/me
};
