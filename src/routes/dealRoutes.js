// fix it to dealRoutes
const dealController  = require('../controllers/dealController');

// Export as a Fastify plugin
module.exports = async function (fastify, opts) {
  // GET all restaurants
  fastify.get('/', dealController.getAllDeals);
  fastify.get('/:id', dealController.getDealById);
};