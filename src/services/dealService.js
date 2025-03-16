// const supabase = require('../config/supabaseClient');
// const { Deal } = require('../models/Deal');

// class DealService {
//   static async getAllDeals() {
//     const { data, error } = await supabase
//       .from('Deals')
//       .select('*');

//     if (error) throw error;
//     return data.map(deal => new Deal(deal));
//   }

//   // Add other CRUD operations
// }

// module.exports = DealService;