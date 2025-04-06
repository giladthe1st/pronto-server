// src/services/restaurantService.js
const supabase = require('../config/supabaseClient');
const Restaurant = require('../models/Restaurant'); // Assume Restaurant model handles properties including optional distance

class RestaurantService {
  /**
   * Retrieves all restaurants, optionally calculating distance from a user's location.
   * @param {number | null} userLat - User's latitude.
   * @param {number | null} userLon - User's longitude.
   * @returns {Promise<Array<Restaurant>>} - A promise that resolves to an array of Restaurant objects.
   */
  static async getAllRestaurants(userLat = null, userLon = null) {
    const R = 6371; // Radius of the Earth in kilometers
    let selectQuery = `
        id,
        created_at,
        name,
        logo_url,
        website_url,
        reviews_count,
        average_rating,
        address,
        maps_url,
        latitude,
        longitude
    `; // Explicitly list columns

    // Add distance calculation if user coordinates are provided and valid
    const hasValidCoords = typeof userLat === 'number' && typeof userLon === 'number' && !isNaN(userLat) && !isNaN(userLon);

    if (hasValidCoords) {
      // Haversine formula for distance calculation
      // Note: Ensure 'latitude' and 'longitude' columns in your DB are numeric types (e.g., float8, numeric)
      // This formula assumes degrees in the database and converts to radians for calculation.
      // It also assumes restaurant latitude/longitude are not null. Handle nulls if necessary (e.g., using COALESCE).
      selectQuery += `,
        ( ${R} * acos(
            cos( radians(${userLat}) ) *
            cos( radians( latitude ) ) *
            cos( radians( longitude ) - radians(${userLon}) ) +
            sin( radians(${userLat}) ) *
            sin( radians( latitude ) )
          )
        ) AS distance
      `;
    }

    try {
      console.log(`Fetching restaurants from Supabase${hasValidCoords ? ' with distance calculation' : ''}`);
      console.log(`Using select query: ${selectQuery.replace(/\s+/g, ' ')}`); // Log the query for debugging

      // Set a timeout promise to race against the Supabase query
      const timeoutPromise = new Promise((_, reject) => {
        // Using 8 seconds timeout as before
        setTimeout(() => reject(new Error('Database query timeout')), 8000);
      });

      // Create the Supabase query using the constructed select string
      const supabasePromise = supabase
        .from('Restaurants')
        .select(selectQuery);

      // Race the promises to enforce a timeout
      // Using Promise.race ensures that if either the query finishes or the timeout hits,
      // we proceed, preventing hangs.
      const { data, error } = await Promise.race([
        supabasePromise,
        timeoutPromise
      ]);

      // Check for errors from Supabase or the timeout
      if (error) {
        // Log the specific error, whether it's from Supabase or our timeout
        console.error('Supabase error or timeout:', error.message);
        // Re-throw the original error to be handled by the controller
        throw error;
      }

      // Validate the data received from Supabase
      if (!data || !Array.isArray(data)) {
        // This might happen if the query returns unexpected results or is empty
        console.warn('Received no data or invalid data format from Supabase:', data);
        return []; // Return an empty array if no valid data is found
      }

      // Map the raw data to Restaurant model instances
      // Ensure the Restaurant model can handle all selected properties, including the optional 'distance'
      return data.map(dto => {
        // Assuming Restaurant constructor or a method handles mapping dto properties
        const restaurant = new Restaurant(dto);

        // Explicitly add distance if calculated, ensuring it's a number
        if (dto.distance !== undefined && dto.distance !== null) {
          // Ensure distance is stored as a number, potentially rounding it
          restaurant.distance = parseFloat(dto.distance.toFixed(2)); // Example: round to 2 decimal places
        } else {
            // If distance wasn't calculated or is null from DB, explicitly set to null or undefined
            restaurant.distance = null;
        }

        // Add any other necessary transformations here (like rating normalization if not done in model)

        // Return the Restaurant instance (or its JSON representation if preferred)
        // Assuming the controller expects model instances or plain objects
        return restaurant.toJSON ? restaurant.toJSON() : restaurant;
      });

    } catch (error) {
      // Catch errors from the try block (e.g., mapping errors, re-thrown Supabase/timeout errors)
      console.error('Error in getAllRestaurants service:', error.message);

      // Provide specific user-friendly messages based on the error type
      if (error.message.includes('timeout')) {
        // Specific message for timeouts
        throw new Error('Restaurant data fetch timed out. Please try again later.');
      } else if (error.message.includes('acos')) {
          // Specific message if distance calculation fails (e.g., bad lat/lon data)
          console.error("Potential issue with latitude/longitude data in database for distance calculation.");
          throw new Error('Failed to calculate distances due to invalid location data.');
      }
      // Rethrow other errors for the controller to handle generically
      throw new Error(`Failed to retrieve restaurants: ${error.message}`);
    }
  }
}

module.exports = RestaurantService;