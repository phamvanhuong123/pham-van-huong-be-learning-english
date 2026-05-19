import { Router } from 'express'

import authRoute from '@/routes/v1/authRoutes'
const route = Router()

route.use('/auth',authRoute)

export const APIs_v1 = route