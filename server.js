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
const serverlessHandler = async (req, res) => {
  const timeout = setTimeout(() => {
    console.error('Function execution timeout is about to occur');
    if (!res.headersSent) {
      res.statusCode = 504;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Gateway Timeout',
        message: 'The request took too long to process. Please try again later.'
      }));
    }
  }, 50000); // Set to 50 seconds (10s less than the Vercel limit)

  try {
    // Important: Don't listen to the server in serverless environment
    // Just await all plugins to be ready
    await fastify.ready();

    // Use Fastify's server directly without trying to call server.listen()
    // This is the recommended approach for serverless environments
    fastify.server.emit('request', req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);

    // Send a response if one hasn't been sent yet
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message || 'An unexpected error occurred'
      }));
    }
  } finally {
    // Clear the timeout when the request is complete
    clearTimeout(timeout);
  }
};

// Export the serverless handler
module.exports = serverlessHandler;