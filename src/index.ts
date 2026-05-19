import express from "express";
import { APIs_v1 } from "@/routes/v1";
import { prisma } from "@/config/prisma";
import exitHook from "exit-hook";

const START_SERVER = () => {
  const port = 5000;
  const app = express();
  app.use(APIs_v1);
  app.listen(5000, () => {
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
  } catch (error) {
    console.error(error);
    process.exit(0);
  }
})();
