
const supabase = require('../config/supabaseClient');
const RestaurantCategory = require('../models/RestaurantCategory');

class RestaurantCategoryService {
  static async getAllRestaurantCategories() {
    try {
      console.log('Fetching restaurant categories from Supabase');

      // Set a timeout promise to race against the Supabase query
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 8000);
      });

      // Create the Supabase query
      const supabasePromise = supabase
        .from('Restaurant_Categories')
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

      // Ensure data is mapped correctly
      return data.map(restaurantCategory => new RestaurantCategory(restaurantCategory));
    } catch (error) {
      console.error('Error fetching restaurant categories:', error.message);
      // Rethrow with a more specific message
      if (error.message.includes('timeout')) {
        throw new Error('Restaurant category data fetch timed out. Please try again later.');
      }
      throw error;
    }
  }

  static async getRestaurantCategoryByRestaurantId(restaurantId, id) {
    const { data, error } = await supabase
      .from('Restaurant_Categories')
      .select('*')
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .single();

    if (error) {
      console.error('Error fetching restaurant category:', error);
      throw error;
    }

    return new RestaurantCategory(data);
  }

  /**
   * Replace all categories for a restaurant (delete old, insert new)
   * @param {number} restaurantId
   * @param {string[]} categories
   */
  static async replaceCategoriesForRestaurant(restaurantId, categories) {
    const supabase = require('../config/supabaseClient');
    // Remove all existing categories
    const { error: deleteError } = await supabase
      .from('Restaurant_Categories')
      .delete()
      .eq('restaurant_id', restaurantId);
    if (deleteError) {
      console.error('Error deleting old categories:', deleteError);
      throw deleteError;
    }
    // Insert new categories
    if (Array.isArray(categories) && categories.length > 0) {
      const insertData = categories.map(category_name => ({
        restaurant_id: restaurantId,
        category_name
      }));
      const { error: insertError } = await supabase
        .from('Restaurant_Categories')
        .insert(insertData);
      if (insertError) {
        console.error('Error inserting new categories:', insertError);
        throw insertError;
      }
    }
    return true;
  }
}

module.exports = RestaurantCategoryService;