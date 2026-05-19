import express from "express";
import { APIs_v1 } from "@/routes/v1";
import { prisma } from "@/config/prisma";
import exitHook from "exit-hook";
import { errorHandler } from "@/middlewares/errorHandler";
import  cookieParser from 'cookie-parser';
const START_SERVER = () => {
  const port = 5000;
  const app = express();
  app.use(cookieParser())
  app.use(express.json())
  app.use('/api/v1',APIs_v1);
  app.use(errorHandler)
  app.listen(port, () => {
    console.log(`Listen dev :http://localhost:${port}`);
  });
  exitHook(() => {
    prisma.$disconnect().then(() => console.log("Đã ngắn kết nối database"))
  })
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
