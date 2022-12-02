import 'dotenv/config';
import mongoose from 'mongoose';
import cors from 'cors';
import { graphqlHTTP } from 'express-graphql';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import firebaseApp from './firebase/firebaseApp.js';
import express, { Application } from 'express';
import context from './graphQL/context.js';
import schema from './graphQL/mergedSchema.js';
console.log('Firebase project id: ' + firebaseApp);

try {
  console.log(process.env.MONGO_CLOUD_URI);
  await mongoose.connect(process.env.MONGO_CLOUD_URI);
} catch (err) {
  throw new Error('Failed to connect to MongoDB');
}

const app: Application = express();
app.use(express.json());
app.use(cors());
app.use(
  '/graphql',
  graphqlHTTP(async (req, res) => {
    return {
      schema: schema,
      graphiql: true,
      context: await context(req, res),
    };
  }),
);

app.listen(9000);

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
