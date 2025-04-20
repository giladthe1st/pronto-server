require('dotenv').config();
const fastify = require('fastify')({
  logger: true // Keep logging enabled
});
const routes = require('./src/routes'); // Assuming your combined routes are here
const PORT = process.env.PORT || 3001;

// Register CORS - Ensure Authorization header is allowed if not already
fastify.register(require('@fastify/cors'), {
  origin: ['http://localhost:3000', 'https://pronto-client.vercel.app', 'https://your-production-domain.com'], // Add all relevant frontend origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Make sure Authorization is included
  credentials: true,
});

// === Register Multipart Plugin (NEW) ===
// This needs to be registered before routes that handle file uploads.
fastify.register(require('@fastify/multipart'), {
    // attachFieldsToBody: true, // Optional: If you want form fields mixed into request.body
    limits: {
        fileSize: 10 * 1024 * 1024, // Example: 10MB limit per file, adjust as needed
        // files: 1 // Optional: Limit to 1 file per request for the bulk upload
    },
});
// === End Multipart Plugin ===


// Keep your custom JSON parser if you specifically need it,
// otherwise Fastify's default might suffice.
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

// Register your combined API routes (including the new /api/admin routes)
fastify.register(routes, { prefix: '/api' });


// For traditional NodeJS environment (Development/Testing)
const start = async () => {
  try {
    await fastify.listen({
      port: PORT,
      host: '0.0.0.0' // Good practice for container environments
    });
    // Note: fastify.log.info is available because logger: true
    fastify.log.info(`Fastify server running locally on port: ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Only start the server when running directly (not in serverless import)
// Adjusted condition slightly for clarity
if (require.main === module && process.env.VERCEL !== '1') { // Check VERCEL env var too
  start();
}


// For Vercel serverless environment
const serverlessHandler = async (req, res) => {
  // Keep your timeout logic
  const timeout = setTimeout(() => {
    fastify.log.error('Function execution timeout imminent!');
    if (!res.headersSent) {
      res.statusCode = 504; // Gateway Timeout
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Gateway Timeout',
        message: 'The request processing time exceeded the limit.'
      }));
    }
  }, 50000); // ~50 seconds, adjust based on Vercel plan limits (e.g., 60s, 300s)

  try {
    // Ensure all plugins (including multipart) are loaded
    await fastify.ready();

    // Directly use the Fastify instance to handle the request
    fastify.server.emit('request', req, res);

  } catch (error) {
    fastify.log.error({ msg: 'Serverless handler error', error: error.message, stack: error.stack });

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message || 'An unexpected error occurred during request processing.'
      }));
    }
  } finally {
    clearTimeout(timeout); // Always clear the timeout
  }
};

// Export the handler for Vercel
module.exports = serverlessHandler;

// Optional: Export the fastify instance if needed elsewhere (e.g., for tests)
// module.exports.fastify = fastify;