const restaurantRoutes = require('./restaurantRoutes');

// Register all routes as a Fastify plugin
module.exports = async function (fastify, opts) {
  // Register restaurant routes with '/restaurants' prefix
  fastify.register(restaurantRoutes, { prefix: '/restaurants' });

  // Add other routes here
};