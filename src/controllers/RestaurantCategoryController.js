const RestaurantCategoryService = require('../services/restaurantCategoryService');

const restaurantCategoryController = {
  getAllRestaurantCategories: async (request, reply) => {
    try {
      const restaurantCategories = await RestaurantCategoryService.getAllRestaurantCategories();
      return restaurantCategories; // Fastify automatically serializes the response
    } catch (error) {
      console.error('Restaurant category controller error:', error.message);

      // Determine appropriate status code based on error
      let statusCode = 500;
      let errorMessage = 'Internal server error';

      if (error.message.includes('timeout')) {
        statusCode = 504;
        errorMessage = 'Request timed out. Please try again later.';
      }

      reply.code(statusCode).send({
        error: errorMessage,
        message: error.message
      });
    }
  },
  getRestaurantCategoryByRestaurantId: async (request, reply) => {
    const { id } = request.params;

    try {
      return await RestaurantCategoryService.getRestaurantCategoryByRestaurantId(id);
    } catch (error) {
      reply.code(error.message.includes('timeout') ? 504 : 500).send({
        error: error.message.includes('timeout') ? 'Gateway Timeout' : 'Internal Server Error',
        message: error.message
      });
    }
  }
};

module.exports = restaurantCategoryController;