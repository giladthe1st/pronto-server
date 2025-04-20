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

    static async listAllDeals(options = {}) {
      // TODO: Add pagination (options.page, options.limit), filtering (options.restaurantId)
      try {
          console.log(`Service: Fetching all deals from Supabase`);
          const { data, error } = await supabase
              .from('Deals')
              .select('*')
              // .eq('restaurant_id', options.restaurantId) // Example filter
              // .range(start, end) // Example pagination
              .order('created_at', { ascending: false }); // Example order

            if (error) throw error;
            return data ? data.map(dealData => new Deal(dealData)) : [];
      } catch (error) {
          console.error(`Service: Error listing all deals:`, error.message);
          throw error;
      }
  }

  static async createDeal(dealData) {
      const deal = new Deal(dealData);
      // TODO: Add validation (e.g., check if restaurant_id exists in Restaurants table)
        if (!deal.isValid()) { // Use your model's validation
            throw new Error("Validation failed: Deal data is incomplete.");
        }
      try {
            const { data, error } = await supabase
              .from('Deals')
              .insert(deal.toJSON ? deal.toJSON() : deal)
              .select()
              .single();

            if (error) throw error;
            return data ? new Deal(data) : null;
      } catch (error) {
            console.error('Service error creating deal:', error);
            if (error.code === '23503') { // Foreign key violation
                throw new Error(`Cannot create deal: Restaurant with ID ${deal.restaurant_id} does not exist.`);
            }
            throw new Error(`Database error creating deal: ${error.message}`);
      }
  }

    static async findDealById(id) {
      try {
            const { data, error } = await supabase
              .from('Deals')
              .select('*')
              .eq('id', id)
              .maybeSingle();

            if (error) throw error;
            return data ? new Deal(data) : null;
      } catch (error) {
            console.error(`Service error finding deal ${id}:`, error);
            throw new Error(`Database error finding deal: ${error.message}`);
      }
  }

    static async updateDeal(id, updateData) {
        // TODO: Validation
        delete updateData.id;
        delete updateData.created_at;
        if (Object.keys(updateData).length === 0) {
            throw new Error("No valid fields provided for update.");
        }
      try {
            const { data, error, count } = await supabase
              .from('Deals')
              .update(updateData)
              .eq('id', id)
              .select()
              .single();

            if (error) throw error;
            if (!data) {
              console.warn(`Service: No deal found with id ${id} to update.`);
              return null;
          }
          return new Deal(data);
      } catch (error) {
            console.error(`Service error updating deal ${id}:`, error);
            if (error.code === '23503') { // Foreign key violation
                throw new Error(`Cannot update deal: Restaurant with ID ${updateData.restaurant_id} does not exist.`);
            }
            throw new Error(`Database error updating deal: ${error.message}`);
      }
  }

    static async deleteDeal(id) {
      try {
          const { error, count } = await supabase
              .from('Deals')
              .delete()
              .eq('id', id);

            if (error) throw error;
            const success = count > 0;
            if(!success) {
                console.warn(`Service: No deal found with id ${id} to delete.`);
            }
            return success;
      } catch (error) {
          console.error(`Service error deleting deal ${id}:`, error);
          throw new Error(`Database error deleting deal: ${error.message}`);
      }
  }

}

module.exports = DealService;