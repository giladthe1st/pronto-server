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
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 8000);
      });

      const supabasePromise = supabase
        .from('Restaurants')
        .select(selectQuery);

      const { data, error } = await Promise.race([
        supabasePromise,
        timeoutPromise
      ]);

      if (error) {
        console.error('Supabase error or timeout:', error.message);
        throw error;
      }

      if (!data || !Array.isArray(data)) {
        console.warn('Received no data or invalid data format from Supabase:', data);
        return [];
      }

      return data.map(dto => {
        const restaurant = new Restaurant(dto);

        if (dto.distance !== undefined && dto.distance !== null) {
          restaurant.distance = parseFloat(dto.distance.toFixed(2));
        } else {
          restaurant.distance = null;
        }

        return restaurant.toJSON ? restaurant.toJSON() : restaurant;
      });

    } catch (error) {
      console.error('Error in getAllRestaurants service:', error.message);

      if (error.message.includes('timeout')) {
        throw new Error('Restaurant data fetch timed out. Please try again later.');
      } else if (error.message.includes('acos')) {
        throw new Error('Failed to calculate distances due to invalid location data.');
      }
      throw new Error(`Failed to retrieve restaurants: ${error.message}`);
    }
  }

    static async bulkInsertRestaurants(restaurantsData) {
      // Basic validation check on input array
      if (!Array.isArray(restaurantsData) || restaurantsData.length === 0) {
          return { insertedCount: 0, error: new Error("No restaurant data provided for bulk insert.") };
      }

      // Optional: Map data through the model constructor for consistency / default values
      const restaurantsToInsert = restaurantsData.map(data => new Restaurant(data).toJSON());

      try {
          // Supabase batch insert
          const { data, error, count } = await supabase
              .from('Restaurants')
              .insert(restaurantsToInsert, {
                  // Adjust based on desired behavior:
                  // upsert: false, // Don't update if conflict (default)
                  // onConflict: 'id', // Specify conflict column if upserting
              })
              .select(); // Return the inserted rows (optional)


          if (error) {
              console.error('Supabase bulk insert error:', error);
              // Check for specific errors like unique violations if needed
              return { insertedCount: 0, error };
          }

          // Supabase v2 `count` might be null on insert, rely on data length if available
          const insertedCount = data ? data.length : (count !== null ? count : 0);
          return { insertedCount: insertedCount, error: null };

      } catch (error) {
          console.error('Error during bulk restaurant insert service:', error);
          return { insertedCount: 0, error };
      }
  }

  static async createRestaurant(restaurantData) {
      // TODO: Add validation before inserting
      const restaurant = new Restaurant(restaurantData); // Apply model defaults/structure
      try {
          const { data, error } = await supabase
              .from('Restaurants')
              .insert(restaurant.toJSON ? restaurant.toJSON() : restaurant)
              .select()
              .single(); // Expect single row back

          if (error) throw error;
          return data ? new Restaurant(data) : null; // Return model instance
      } catch (error) {
          console.error('Service error creating restaurant:', error);
          // Add specific error handling (e.g., duplicate name?)
          throw new Error(`Database error creating restaurant: ${error.message}`);
      }
  }

  static async findRestaurantById(id) {
      try {
          const { data, error } = await supabase
              .from('Restaurants')
              .select('*') // Select all columns or specify needed ones
              .eq('id', id)
              .maybeSingle(); // Use maybeSingle to return null if not found, instead of error

          if (error) throw error;
          return data ? new Restaurant(data) : null;
      } catch (error) {
          console.error(`Service error finding restaurant ${id}:`, error);
          throw new Error(`Database error finding restaurant: ${error.message}`);
      }
  }

  static async updateRestaurant(id, updateData) {
    // TODO: Add validation for updateData
    // Remove fields that shouldn't be updated directly (e.g., id, created_at)
    delete updateData.id;
    delete updateData.created_at;

    // Extract categories if present
    const categories = updateData.categories;
    if (categories !== undefined) {
      delete updateData.categories;
    }

    if (Object.keys(updateData).length === 0 && categories === undefined) {
      throw new Error("No valid fields provided for update.");
    }

    const RestaurantCategoryService = require('./restaurantCategoryService');
    try {
      // Update restaurant details if there are fields to update
      let updatedRestaurant = null;
      if (Object.keys(updateData).length > 0) {
        const { data, error } = await supabase
          .from('Restaurants')
          .update(updateData)
          .eq('id', id)
          .select()
          .single(); // Return the updated row
        if (error) throw error;
        if (!data) {
          console.warn(`Service: No restaurant found with id ${id} to update, or no changes detected.`);
          return null;
        }
        updatedRestaurant = new Restaurant(data);
      } else {
        // If only categories are being updated, fetch the restaurant
        const { data, error } = await supabase
          .from('Restaurants')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (!data) {
          console.warn(`Service: No restaurant found with id ${id} when updating categories.`);
          return null;
        }
        updatedRestaurant = new Restaurant(data);
      }
      // Update categories if present
      if (categories !== undefined) {
        await RestaurantCategoryService.replaceCategoriesForRestaurant(id, categories);
      }
      return updatedRestaurant;
    } catch (error) {
      console.error(`Service error updating restaurant ${id}:`, error);
      throw new Error(`Database error updating restaurant: ${error.message}`);
    }
  }

  static async deleteRestaurant(id) {
      try {
          const { error, count } = await supabase
              .from('Restaurants')
              .delete()
              .eq('id', id);

          if (error) throw error;

          // Check the count to see if a row was deleted
          const success = count > 0;
          if(!success) {
              console.warn(`Service: No restaurant found with id ${id} to delete.`);
          }
          return success;

      } catch (error) {
          console.error(`Service error deleting restaurant ${id}:`, error);
          // Handle specific errors like foreign key violations (e.g., if deals exist)
          if (error.code === '23503') { // Foreign key violation code in Postgres
              throw new Error(`Cannot delete restaurant ${id} because it still has associated deals or categories.`);
          }
          throw new Error(`Database error deleting restaurant: ${error.message}`);
      }
  }
}

module.exports = RestaurantService;