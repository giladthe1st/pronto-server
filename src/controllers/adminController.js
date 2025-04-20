// controllers/adminController.js
const RestaurantService = require('../services/restaurantService');
const DealService = require('../services/dealService');
const papaparse = require('papaparse');
const { finished } = require('stream/promises'); // Use promise version

const adminController = {

  // == Restaurant Actions ==

  bulkUploadRestaurants: async (request, reply) => {
    const fileData = await request.file(); // From fastify-multipart
    if (!fileData) {
      return reply.code(400).send({ error: 'Bad Request', message: 'No file uploaded.' });
    }

    const allowedTypes = ['text/csv', 'application/json'];
    if (!allowedTypes.includes(fileData.mimetype)) {
      // Important: Drain the stream even if the type is wrong
      await fileData.toBuffer(); // Or use stream piping if memory is a concern
      return reply.code(400).send({ error: 'Bad Request', message: 'Invalid file type. Only CSV or JSON allowed.' });
    }

    console.log(`Admin controller: Processing bulk upload file: ${fileData.filename} (${fileData.mimetype}) by user ${request.user.email}`);

    try {
      const restaurantsToInsert = [];
      const errors = [];
      let rowCounter = 0; // For error reporting

      // --- Process File Stream ---
      if (fileData.mimetype === 'text/csv') {
        const parsingStream = fileData.file.pipe(papaparse.parse(papaparse.NODE_STREAM_INPUT, {
          header: true, // Assume CSV has headers matching DB columns (or map them)
          skipEmptyLines: true,
          transformHeader: header => header.trim(), // Clean headers
           // Add step function for row-by-row processing if needed (better memory for huge files)
          // step: function(results, parser) { ... }
        }));

         for await (const row of parsingStream) {
            rowCounter++;
            // Basic validation (adapt based on your Restaurant model)
            if (!row.name || !row.address) { // Example required fields
                errors.push({ row: rowCounter, message: 'Missing required field (name or address)', data: row });
                continue; // Skip invalid row
            }
             // TODO: Add more robust validation (data types, ranges for lat/lon, etc.)
             // Ensure numeric fields are parsed correctly
             row.average_rating = parseFloat(row.average_rating) || 0;
             row.reviews_count = parseInt(row.reviews_count, 10) || 0;
             row.latitude = parseFloat(row.latitude) || null;
             row.longitude = parseFloat(row.longitude) || null;

             // Remove empty strings, map to DB structure if headers differ
            const cleanedRow = Object.fromEntries(
                Object.entries(row).map(([key, value]) => [key, value === '' ? null : value])
            );

            restaurantsToInsert.push(cleanedRow);
         }

      } else if (fileData.mimetype === 'application/json') {
        const buffer = await fileData.toBuffer();
        const jsonData = JSON.parse(buffer.toString());
        if (!Array.isArray(jsonData)) {
          return reply.code(400).send({ error: 'Bad Request', message: 'JSON file must contain an array of restaurant objects.' });
        }
        // TODO: Add validation similar to CSV processing for each object in jsonData
        restaurantsToInsert.push(...jsonData); // Add validation loop here
        rowCounter = restaurantsToInsert.length;
      }

       // --- Database Insertion ---
      if (restaurantsToInsert.length > 0) {
        console.log(`Attempting to bulk insert ${restaurantsToInsert.length} valid restaurants...`);
        const { insertedCount, error: insertError } = await RestaurantService.bulkInsertRestaurants(restaurantsToInsert);

        if (insertError) {
           errors.push({ row: 'N/A', message: `Database bulk insert failed: ${insertError.message}`, data: null });
        }

         console.log(`Bulk upload result: ${insertedCount} inserted, ${errors.length} validation/insert errors.`);
         return reply.code(200).send({
           message: `Processed ${rowCounter} rows. Successfully inserted: ${insertedCount}. Errors: ${errors.length}.`,
           successCount: insertedCount,
           errorCount: errors.length,
           errors: errors, // Send detailed errors back
         });

      } else {
         console.log(`Bulk upload: No valid restaurants found to insert. Validation errors: ${errors.length}.`);
         return reply.code(400).send({
           message: `No valid restaurant data found in the file. Errors: ${errors.length}.`,
           successCount: 0,
           errorCount: errors.length,
           errors: errors,
         });
      }

    } catch (error) {
      console.error('Error processing bulk upload:', error);
      // Ensure file stream is consumed on error if not already done
      if (fileData && fileData.file && !fileData.file.readableEnded) {
          fileData.file.resume(); // Drain the stream quickly
      }
      return reply.code(500).send({ error: 'Internal Server Error', message: `Failed to process file: ${error.message}` });
    }
  },

  listRestaurants: async (request, reply) => {
    try {
      // TODO: Add pagination, filtering, sorting options from query params
      const restaurants = await RestaurantService.getAllRestaurants(); // Use existing or create specific list function
      // Fetch all categories for all restaurants in one query
      const { data: allCategories, error: categoriesError } = await require('../config/supabaseClient')
        .from('Restaurant_Categories')
        .select('restaurant_id, category_name');
      // Group categories by restaurant_id
      const categoriesMap = {};
      if (!categoriesError && Array.isArray(allCategories)) {
        for (const row of allCategories) {
          if (!categoriesMap[row.restaurant_id]) categoriesMap[row.restaurant_id] = [];
          categoriesMap[row.restaurant_id].push(row.category_name);
        }
      }
      // Attach categories to each restaurant
      const response = restaurants.map(r => ({
        ...r,
        categories: categoriesMap[r.id] || []
      }));
      console.log('Response sent to UI (listRestaurants):', response);
      return response;
    } catch (error) {
      console.error('Admin controller error listing restaurants:', error.message);
      return reply.code(500).send({ error: 'Internal Server Error', message: error.message });
    }
  },

  createRestaurant: async (request, reply) => {
    try {
      const newRestaurantData = request.body;
      // TODO: Add validation using a schema library (like Zod) or manually
      const createdRestaurant = await RestaurantService.createRestaurant(newRestaurantData);
      return reply.code(201).send(createdRestaurant);
    } catch (error) {
       console.error('Admin controller error creating restaurant:', error.message);
       // Handle specific errors like unique constraints if needed
       return reply.code(error.message.includes('validation') ? 400 : 500)
                   .send({ error: 'Error Creating Restaurant', message: error.message });
    }
  },

  getRestaurant: async (request, reply) => {
    try {
      const { id } = request.params;
      const restaurant = await RestaurantService.findRestaurantById(id);
      if (!restaurant) {
        return reply.code(404).send({ error: 'Not Found', message: 'Restaurant not found' });
      }
      // Fetch categories for this restaurant
      const { data: categoriesData, error: categoriesError } = await require('../config/supabaseClient')
        .from('Restaurant_Categories')
        .select('category_name')
        .eq('restaurant_id', id);
      let categories = [];
      if (!categoriesError && Array.isArray(categoriesData)) {
        categories = categoriesData.map(c => c.category_name);
      }
      const response = { ...restaurant.toJSON ? restaurant.toJSON() : restaurant, categories };
      console.log('Response sent to UI (getRestaurant):', response);
      return response;
    } catch (error) {
       console.error(`Admin controller error getting restaurant ${request.params.id}:`, error.message);
       return reply.code(500).send({ error: 'Internal Server Error', message: error.message });
    }
  },

  updateRestaurant: async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      // TODO: Add validation
      const updatedRestaurant = await RestaurantService.updateRestaurant(id, updateData);
      if (!updatedRestaurant) {
        return reply.code(404).send({ error: 'Not Found', message: 'Restaurant not found or no changes made' });
      }
      // Fetch categories for this restaurant
      const RestaurantCategoryService = require('../services/restaurantCategoryService');
      const { data: categoriesData, error: categoriesError } = await require('../config/supabaseClient')
        .from('Restaurant_Categories')
        .select('category_name')
        .eq('restaurant_id', id);
      let categories = [];
      if (!categoriesError && Array.isArray(categoriesData)) {
        categories = categoriesData.map(c => c.category_name);
      }
      // Return restaurant with categories
      const response = { ...updatedRestaurant.toJSON ? updatedRestaurant.toJSON() : updatedRestaurant, categories };
      console.log('Response sent to UI (updateRestaurant):', response);
      return response;
    } catch (error) {
      console.error(`Admin controller error updating restaurant ${request.params.id}:`, error.message);
      return reply.code(error.message.includes('validation') ? 400 : 500)
        .send({ error: 'Error Updating Restaurant', message: error.message });
    }
  },

  deleteRestaurant: async (request, reply) => {
    try {
      const { id } = request.params;
      const success = await RestaurantService.deleteRestaurant(id);
       if (!success) {
           // Could be because it was already deleted or never existed
        return reply.code(404).send({ error: 'Not Found', message: 'Restaurant not found or already deleted' });
      }
      return reply.code(204).send(); // No content on successful delete
    } catch (error) {
       console.error(`Admin controller error deleting restaurant ${request.params.id}:`, error.message);
       // Handle foreign key constraint errors if necessary (e.g., deals exist)
       return reply.code(500).send({ error: 'Internal Server Error', message: error.message });
    }
  },

  // == Deal Actions (Implement similarly to Restaurants) ==

  listDeals: async (request, reply) => {
      try {
        // TODO: Add pagination, filter by restaurant_id?
        const deals = await DealService.listAllDeals(); // Needs implementation in DealService
        return deals;
      } catch (error) {
         console.error('Admin controller error listing deals:', error.message);
         return reply.code(500).send({ error: 'Internal Server Error', message: error.message });
      }
  },
  createDeal: async (request, reply) => {
      try {
        const newDealData = request.body;
        // TODO: Validation (ensure restaurant_id exists)
        const createdDeal = await DealService.createDeal(newDealData); // Needs implementation
        return reply.code(201).send(createdDeal);
      } catch (error) {
          console.error('Admin controller error creating deal:', error.message);
          return reply.code(error.message.includes('validation') ? 400 : 500)
                      .send({ error: 'Error Creating Deal', message: error.message });
      }
  },
  getDeal: async (request, reply) => {
      try {
        const { id } = request.params;
        const deal = await DealService.findDealById(id); // Needs implementation
        if (!deal) {
            return reply.code(404).send({ error: 'Not Found', message: 'Deal not found' });
        }
        return deal;
      } catch (error) {
          console.error(`Admin controller error getting deal ${request.params.id}:`, error.message);
          return reply.code(500).send({ error: 'Internal Server Error', message: error.message });
      }
  },
  updateDeal: async (request, reply) => {
      try {
        const { id } = request.params;
        const updateData = request.body;
        // TODO: Validation
        const updatedDeal = await DealService.updateDeal(id, updateData); // Needs implementation
        if (!updatedDeal) {
            return reply.code(404).send({ error: 'Not Found', message: 'Deal not found or no changes made' });
        }
        return updatedDeal;
      } catch (error) {
          console.error(`Admin controller error updating deal ${request.params.id}:`, error.message);
          return reply.code(error.message.includes('validation') ? 400 : 500)
                      .send({ error: 'Error Updating Deal', message: error.message });
      }
  },
   deleteDeal: async (request, reply) => {
      try {
        const { id } = request.params;
        const success = await DealService.deleteDeal(id); // Needs implementation
        if (!success) {
            return reply.code(404).send({ error: 'Not Found', message: 'Deal not found or already deleted' });
        }
        return reply.code(204).send();
      } catch (error) {
          console.error(`Admin controller error deleting deal ${request.params.id}:`, error.message);
          return reply.code(500).send({ error: 'Internal Server Error', message: error.message });
      }
   },

};

module.exports = adminController;