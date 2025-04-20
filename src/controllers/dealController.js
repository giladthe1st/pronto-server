// src/controllers/dealController.js
const DealService = require('../services/dealService');

const dealController = {
  // Renamed and modified from getAllDeals
  getDealsByRestaurantId: async (request, reply) => {
    // Extract restaurantId from the URL parameters
    const { restaurantId } = request.params;

    // Basic validation
    if (!restaurantId) {
        return reply.code(400).send({ error: 'Bad Request', message: 'Restaurant ID is required in the URL.' });
    }

    try {
      const timeoutMs = 20000; // 20 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Controller timeout')), timeoutMs)
      );

      // Call the updated service function, passing the restaurantId
      const deals = await Promise.race([
        DealService.getDealsByRestaurantId(restaurantId), // Pass restaurantId here
        timeoutPromise
      ]);

      // If no deals are found, it will return an empty array, which is valid JSON
      return deals; // Fastify automatically serializes the response
    } catch (error) {
      console.error(`Deal controller error for restaurant ${restaurantId}:`, error.message);

      let statusCode = 500;
      let errorMessage = 'Internal server error';

      if (error.message.includes('timeout')) {
        statusCode = 504;
        errorMessage = 'Request timed out retrieving deals. Please try again later.';
      } else if (error.message.includes('Invalid Restaurant ID')) {
          statusCode = 400;
          errorMessage = 'Invalid Restaurant ID format provided.';
      }
      // You could add more specific error handling here if the service throws custom errors

      reply.code(statusCode).send({
        error: errorMessage,
        message: error.message, // Include original message for debugging if desired
        restaurantId: restaurantId // Context
      });
    }
  },
};

module.exports = dealController;