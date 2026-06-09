import express from "express";
import { APIs_v1 } from "@/routes/v1";
import { prisma } from "@/config/prisma";
import exitHook from "exit-hook";
import { errorHandler } from "@/middlewares/errorHandler";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer } from 'http';
import { initSocket } from '@/config/socket';
import { initCronJobs } from '@/config/cron';
import { corsOptions } from './config/cors';
const START_SERVER = () => {
  const port = 5000;
  const app = express();
  app.use(cors(corsOptions))
  app.use(cookieParser())
  app.use(express.json())
  app.use('/api/v1', APIs_v1);
  app.use(errorHandler);

  const httpServer = createServer(app);
  initSocket(httpServer);
  initCronJobs();

  httpServer.listen(port, () => {
    console.log(`Listen dev :http://localhost:${port}`);
  });

  exitHook(() => {
    httpServer.close();
    prisma.$disconnect().then(() => console.log("Đã ngắn kết nối database"));
  });

  process.once('SIGUSR2', () => {
    console.log('Nodemon restart detected. Closing server gracefully...');
    httpServer.close(() => {
      prisma.$disconnect().then(() => {
        process.kill(process.pid, 'SIGUSR2');
      });
    });
  });
};

(async () => {
  try {
    await prisma.$connect();
    console.log("Đã kết nối tới database")
    START_SERVER()
  } catch (error) {
    console.error(error);
    process.exit(0);
  }
})();
