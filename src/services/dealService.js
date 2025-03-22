const supabase = require('../config/supabaseClient');
const Deal = require('../models/Deal'); // Correct import

class DealService {
  static async getAllDeals() {
    try {
      console.log('Fetching deals from Supabase');

      // Set a timeout promise to race against the Supabase query
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 8000);
      });

      // Create the Supabase query
      const supabasePromise = supabase
        .from('Deals')
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
      return data.map(deal => new Deal(deal));
    } catch (error) {
      console.error('Error fetching deals:', error.message);
      // Rethrow with a more specific message
      if (error.message.includes('timeout')) {
        throw new Error('Deal data fetch timed out. Please try again later.');
      }
      throw error;
    }
  }
  //lets add a function to get a deal by id
  static async getDealById(id) {
    const { data, error } = await supabase.from('Deals')
    .select('*')
    .eq('id', id)
    .single();
    return new Deal(data);
  }
}

module.exports = DealService;