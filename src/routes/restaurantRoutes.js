const restaurantController = require('../controllers/RestaurantController');

// Export as a Fastify plugin
module.exports = async function (fastify, opts) {
  // GET all restaurants
  fastify.get('/', restaurantController.getAllRestaurants);
};