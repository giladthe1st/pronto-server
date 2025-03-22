const RestaurantService = require('../services/restaurantService');

const restaurantController = {
  getAllRestaurants: async (request, reply) => {
    console.log('Restaurant controller: getAllRestaurants request received');

    try {
      // Set a timeout for this controller action
      const timeoutMs = 20000; // 20 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Controller timeout')), timeoutMs)
      );

      // Race the actual service call with a timeout
      const restaurants = await Promise.race([
        RestaurantService.getAllRestaurants(),
        timeoutPromise
      ]);

      console.log(`Restaurant controller: returning ${restaurants.length} restaurants`);
      return restaurants; // Fastify automatically serializes the response
    } catch (error) {
      console.error('Restaurant controller error:', error.message);

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
  }
};

module.exports = restaurantController;