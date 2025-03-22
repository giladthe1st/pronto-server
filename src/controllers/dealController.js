// lets convert it to dealsController
const DealService = require('../services/dealService');

const dealController = {
  getAllDeals: async (request, reply) => {
    console.log('Deal controller: getAllDeals request received');

    try {
      // Set a timeout for this controller action
      const timeoutMs = 20000; // 20 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Controller timeout')), timeoutMs)
      );

      // Race the actual service call with a timeout
      const deals = await Promise.race([
        DealService.getAllDeals(),
        timeoutPromise
      ]);

      console.log(`Deal controller: returning ${deals.length} deals`);
      return deals; // Fastify automatically serializes the response
    } catch (error) {
      console.error('Deal controller error:', error.message);

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

  getDealById: async (request, reply) => {
    const { id } = request.params;
    const deal = await DealService.getDealById(id);
    return deal;
  }
};

module.exports = dealController;