const RestaurantService = require('../services/restaurantService');

/**
 * Controller responsible for handling requests related to Restaurants.
 */
const restaurantController = {
  /**
   * Handles GET requests to retrieve all restaurants.
   * Optionally accepts user's latitude and longitude as query parameters
   * to calculate distances.
   *
   * @param {object} request - The Fastify request object.
   * @param {object} reply - The Fastify reply object.
   */
  getAllRestaurants: async (request, reply) => {
    console.log('Restaurant controller: getAllRestaurants request received');

    let latitude = null;
    let longitude = null;

    try {
      // --- Location Parameter Handling ---
      const { userLat, userLon } = request.query;

      if (userLat !== undefined && userLon !== undefined) {
        console.log(`Restaurant controller: Received location parameters - Lat: ${userLat}, Lon: ${userLon}`);

        const parsedLat = parseFloat(userLat);
        const parsedLon = parseFloat(userLon);

        // Validate received coordinates
        if (isNaN(parsedLat) || isNaN(parsedLon)) {
          console.warn('Restaurant controller: Invalid latitude or longitude format received.');
          // Don't throw an error, just proceed without location, or return 400 if strict validation is required
          // return reply.code(400).send({
          //   error: 'Bad Request',
          //   message: 'Invalid latitude or longitude format provided. Both must be numbers.'
          // });
        } else if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
           console.warn('Restaurant controller: Latitude or longitude values are out of range.');
           // Optional: Return 400 for out-of-range values
           // return reply.code(400).send({
           //   error: 'Bad Request',
           //   message: 'Latitude must be between -90 and 90, and longitude between -180 and 180.'
           // });
        } else {
           // Assign valid coordinates
           latitude = parsedLat;
           longitude = parsedLon;
           console.log(`Restaurant controller: Using valid location - Lat: ${latitude}, Lon: ${longitude}`);
        }
      } else {
        console.log('Restaurant controller: No location parameters provided.');
      }

      // --- Service Call with Timeout ---
      const controllerTimeoutMs = 20000; // 20 seconds timeout for the controller action
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Controller timeout')), controllerTimeoutMs)
      );

      console.log('Restaurant controller: Calling RestaurantService.getAllRestaurants');
      // Pass latitude and longitude (which might be null) to the service
      const restaurantsPromise = RestaurantService.getAllRestaurants(latitude, longitude);

      // Race the actual service call against the controller timeout
      const restaurants = await Promise.race([
        restaurantsPromise,
        timeoutPromise
      ]);

      console.log(`Restaurant controller: Successfully retrieved ${restaurants.length} restaurants.`);
      // Fastify automatically serializes the response to JSON and sends with status 200
      return restaurants;

    } catch (error) {
      console.error('Restaurant controller error:', error.message);

      // Determine appropriate status code based on error type
      let statusCode = 500; // Default to Internal Server Error
      let errorMessage = 'Internal server error occurred while fetching restaurants.';

      if (error.message.includes('Controller timeout')) {
        statusCode = 504; // Gateway Timeout
        errorMessage = 'The request took too long to process. Please try again later.';
      } else if (error.message.includes('timed out')) {
        // Catch timeouts originating from the service layer (e.g., database timeout)
        statusCode = 504; // Gateway Timeout
        errorMessage = 'Could not retrieve restaurant data in time. Please try again later.';
      }
      // Add more specific error handling if needed (e.g., for database connection errors)

      // Send the error response
      reply.code(statusCode).send({
        error: error.name || 'Error', // Use error name if available
        message: errorMessage,
        details: error.message // Include original message for debugging context if desired
      });
    }
  }
};

module.exports = restaurantController;