require('dotenv').config();
const fastify = require('fastify')({
  logger: true
});
const routes = require('./src/routes');
const PORT = process.env.PORT || 3001;

// Register CORS
fastify.register(require('@fastify/cors'), {
  origin: ['http://localhost:3000', 'https://pronto-client.vercel.app']
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

// For traditional NodeJS environment
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

// Only start the server when running directly (not in serverless)
if (require.main === module && process.env.NODE_ENV !== 'production') {
  start();
}

// For Vercel serverless environment
// This creates a handler that doesn't try to start a server
const serverlessHandler = async (req, res) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};

// Export handler for serverless use
module.exports = serverlessHandler;