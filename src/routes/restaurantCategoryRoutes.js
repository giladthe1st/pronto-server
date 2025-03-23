const restaurantCategoryController = require('../controllers/RestaurantCategoryController');

// Export as a Fastify plugin
module.exports = async function (fastify, opts) {
  // GET all restaurant categories
  fastify.get('/', restaurantCategoryController.getAllRestaurantCategories);
  fastify.get('/:id', restaurantCategoryController.getRestaurantCategoryByRestaurantId);
};