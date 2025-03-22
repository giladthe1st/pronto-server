const RestaurantService = require('../services/restaurantService');

const restaurantController = {
  getAllRestaurants: async (request, reply) => {
    try {
      const restaurants = await RestaurantService.getAllRestaurants();
      return restaurants; // Fastify automatically serializes the response
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  }
};

module.exports = restaurantController;