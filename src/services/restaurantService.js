// src/services/restaurantService.js
const supabase = require('../config/supabaseClient');
const Restaurant = require('../models/Restaurant'); // Correct import

class RestaurantService {
  static async getAllRestaurants() {
    try {
      const { data, error } = await supabase
        .from('Restaurants')
        .select('*');

      if (error) throw error;

      // Ensure data is mapped correctly
      return data.map(restaurant => new Restaurant(restaurant));
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  }
}

module.exports = RestaurantService;