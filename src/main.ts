import 'dotenv/config';
import mongoose from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import firebaseApp from './firebase/firebaseApp.js';
import context from './graphQL/context.js';
import schema from './graphQL/mergedSchema.js';
console.log('Firebase project id: ' + firebaseApp);

try {
  console.log(process.env.MONGO_CLOUD_URI);
  await mongoose.connect(process.env.MONGO_CLOUD_URI, { autoCreate: true });
} catch (err) {
  throw new Error('Failed to connect to MongoDB');
}

/* moving from express-graphql to graphql-http on fastify */
import Fastify from 'fastify'; // yarn add fastify
import { createHandler } from 'graphql-http/lib/use/fastify';
import fastcors from '@fastify/cors';

import configureHttpRoutes from './http/configureHttpRoutes.js';
// Create a fastify instance serving all methods on `/graphql`
// where the GraphQL over HTTP fastify request handler is
const fastify = Fastify();
// allow localhost client to connect
await fastify.register(fastcors, {
  origin: ['https://money-lender.app', 'http://localhost:5173', 'https://localhost'],
  methods: 'GET,HEAD,PUT,PATCH,OPTIONS,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization, if-none-match',
  exposedHeaders: 'ETag',
});

// mount the GraphQL over HTTP fastify request handler on `/graphql` and inlude the schema and context
fastify.all(
  '/graphql',
  createHandler({
    schema,
    context: (req) => ({
      ...context(req),
    }),
  }),
);

configureHttpRoutes(fastify);
fastify.listen({ port: parseInt(process.env.PORT) || 9000, host: '0.0.0.0' });

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, exitCode): void {
  console.log('connection close');
  mongoose.connection.close();
  // mongoose.connection.close();
  if (options.cleanup) console.log('clean');
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
