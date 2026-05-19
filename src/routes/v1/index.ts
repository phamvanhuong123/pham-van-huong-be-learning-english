import express from 'express'

const route = express.Router()
route.get('/status', (req, res) => {
  res.status(200).json({
    message: 'OK'
  });
});

export const APIs_v1 = route