const restaurantRoutes = require('./restaurantRoutes');
const restaurantCategoryRoutes = require('./restaurantCategoryRoutes');

// Register all routes as a Fastify plugin
module.exports = async function (fastify, opts) {
  // Remove the empty register() line below ⚠️
  fastify.register(restaurantRoutes, { prefix: '/restaurants' });
  fastify.register(restaurantCategoryRoutes, { prefix: '/restaurantCategories' });
  // Add other routes here
};