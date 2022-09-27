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
  await mongoose.connect(process.env.MONGO_URI);
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
