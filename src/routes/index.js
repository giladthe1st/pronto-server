const restaurantRoutes = require('./restaurantRoutes');
const dealRoutes = require('./dealRoutes');

// Register all routes as a Fastify plugin
module.exports = async function (fastify, opts) {
  // Register restaurant routes with '/restaurants' prefix
  fastify.register(restaurantRoutes, { prefix: '/restaurants' });
  fastify.register(dealRoutes, { prefix: '/deals' });

  // Add other routes here
};