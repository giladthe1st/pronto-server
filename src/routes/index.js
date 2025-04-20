const restaurantRoutes = require('./restaurantRoutes');
const restaurantCategoryRoutes = require('./restaurantCategoryRoutes');
const adminRoutes = require('./adminRoutes');
const userRoutes = require('./userRoutes');

// Register all routes as a Fastify plugin
module.exports = async function (fastify, opts) {
  // Remove the empty register() line below 
  fastify.register(restaurantRoutes, { prefix: '/restaurants' });
  fastify.register(restaurantCategoryRoutes, { prefix: '/restaurantCategories' });
  fastify.register(userRoutes, { prefix: '/users' }); // Register under /api/users/*

   // Admin API routes
   fastify.register(adminRoutes, { prefix: '/admin' }); // Register under /api/admin/*
};