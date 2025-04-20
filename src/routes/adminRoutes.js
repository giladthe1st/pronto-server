// routes/adminRoutes.js
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/auth'); // Import directly

module.exports = async function (fastify, opts) {

  // Apply verifyAdmin middleware to all routes in this file
  fastify.addHook('preHandler', verifyAdmin);

  // == Restaurant Admin Routes ==
  fastify.post('/restaurants/bulk-upload', adminController.bulkUploadRestaurants);
  fastify.get('/restaurants', adminController.listRestaurants); // Add pagination/search later
  fastify.post('/restaurants', adminController.createRestaurant);
  fastify.get('/restaurants/:id', adminController.getRestaurant);
  fastify.put('/restaurants/:id', adminController.updateRestaurant);
  fastify.delete('/restaurants/:id', adminController.deleteRestaurant);

  // == Deal Admin Routes ==
  fastify.get('/deals', adminController.listDeals); // Add pagination/search later
  fastify.post('/deals', adminController.createDeal);
  fastify.get('/deals/:id', adminController.getDeal); // Get a specific deal by its ID
  fastify.put('/deals/:id', adminController.updateDeal);
  fastify.delete('/deals/:id', adminController.deleteDeal);

  // == Category Admin Routes (Optional - Example: List all) ==
  // You might manage categories indirectly via Restaurants or have separate routes
  // fastify.get('/categories', adminController.listCategories);

};