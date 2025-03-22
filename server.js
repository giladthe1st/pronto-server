require('dotenv').config();
const fastify = require('fastify')({
  logger: true
});
const routes = require('./src/routes');
const PORT = process.env.PORT || 3001;

// Register CORS
fastify.register(require('@fastify/cors'), {
  origin: ['http://localhost:3000', 'https://https://pronto-client.vercel.app']
});

// Parse JSON bodies
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

// Register routes
fastify.register(routes, { prefix: '/api' });

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: PORT,
      host: '0.0.0.0'
    });
    console.log(`Fastify server running on port: ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Check if this is being run directly or imported as a module
if (require.main === module) {
  start();
}

// Export for serverless use
module.exports = fastify;