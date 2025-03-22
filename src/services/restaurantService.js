// src/services/restaurantService.js
const supabase = require('../config/supabaseClient');
const Restaurant = require('../models/Restaurant'); // Correct import

class RestaurantService {
  static async getAllRestaurants() {
    try {
      console.log('Fetching restaurants from Supabase');

      // Set a timeout promise to race against the Supabase query
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 8000);
      });

      // Create the Supabase query
      const supabasePromise = supabase
        .from('Restaurants')
        .select('*');

      // Race the promises to enforce a timeout
      const { data, error } = await Promise.race([
        supabasePromise,
        timeoutPromise
      ]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || !Array.isArray(data)) {
        console.warn('Received invalid data format from Supabase:', data);
        return [];
      }

      console.log(`Successfully fetched ${data.length} restaurants`);

      // Ensure data is mapped correctly
      return data.map(restaurant => new Restaurant(restaurant));
    } catch (error) {
      console.error('Error fetching restaurants:', error.message);
      // Rethrow with a more specific message
      if (error.message.includes('timeout')) {
        throw new Error('Restaurant data fetch timed out. Please try again later.');
      }
      throw error;
    }
  }
}

module.exports = RestaurantService;