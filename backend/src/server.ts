import http from 'http';
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middlewares/error';
import { initSocket } from './lib/socket';

const app = express();
const server = http.createServer(app);

initSocket(server);

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api', routes);
app.use(errorHandler);

server.listen(env.PORT, () => {
  console.log(`🚀 API ready on http://localhost:${env.PORT}/api`);
});
