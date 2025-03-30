const restaurantController = require('../controllers/RestaurantController');
const dealController = require('../controllers/dealController');

// Export as a Fastify plugin
module.exports = async function (fastify, opts) {
  // GET all restaurants
  fastify.get('/', restaurantController.getAllRestaurants);
  fastify.get('/:restaurantId/deals', dealController.getDealsByRestaurantId);
};