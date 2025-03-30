// src/services/dealService.js
const supabase = require('../config/supabaseClient');
const Deal = require('../models/Deal'); // Correct import

class DealService {
  // Renamed and modified from getAllDeals
  static async getDealsByRestaurantId(restaurantId) {
    // Optional: Add more robust validation if needed (e.g., check if it's a positive integer)
    const parsedRestaurantId = parseInt(restaurantId, 10);
    if (isNaN(parsedRestaurantId) || parsedRestaurantId <= 0) {
        console.error(`Invalid restaurantId received in service: ${restaurantId}`);
        throw new Error(`Invalid Restaurant ID format: ${restaurantId}`);
    }

    try {
      console.log(`Service: Fetching deals from Supabase for restaurant_id: ${parsedRestaurantId}`);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 8000); // 8 seconds DB timeout
      });

      // Modify the Supabase query to filter by restaurant_id
      const supabasePromise = supabase
        .from('Deals')
        .select('*')
        .eq('restaurant_id', parsedRestaurantId); // Filter results by restaurant_id

      // Race the promises
      const { data, error } = await Promise.race([
        supabasePromise,
        timeoutPromise
      ]);

      if (error) {
        console.error(`Supabase error fetching deals for restaurant ${parsedRestaurantId}:`, error);
        // Could check for specific Supabase errors, e.g., relation doesn't exist
        throw error; // Rethrow Supabase errors
      }

      // data will be an empty array ([]) if no deals match the restaurant_id. This is expected.
      if (!data) {
          // This case might occur on unexpected Supabase responses, though .eq usually returns [] for no match
          console.warn(`Service: No data object returned from Supabase for restaurant ${parsedRestaurantId}. Returning empty array.`);
          return [];
      }

       if (!Array.isArray(data)) {
        console.warn(`Service: Received non-array data format from Supabase for restaurant ${parsedRestaurantId}:`, data);
        // Depending on how Supabase behaves with .eq, this might indicate an issue.
        // Safely return an empty array or throw an error if this shouldn't happen.
        return [];
      }

      console.log(`Service: Found ${data.length} deals for restaurant ${parsedRestaurantId}.`);
      // Map the raw data to Deal objects
      return data.map(dealData => new Deal(dealData));

    } catch (error) {
      console.error(`Service: Error fetching deals for restaurant ${parsedRestaurantId}:`, error.message);
      // Add specific error message for timeout
      if (error.message.includes('timeout')) {
        throw new Error(`Deal data fetch timed out for restaurant ${parsedRestaurantId}.`);
      }
      // Rethrow other errors (including the validation error from the start)
      throw error;
    }
  }
}

module.exports = DealService;