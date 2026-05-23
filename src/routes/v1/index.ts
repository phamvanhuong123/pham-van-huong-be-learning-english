import { Router } from 'express'

import authRoute from '@/routes/v1/authRoutes'
import examRoute from '@/routes/v1/examRoutes'
const route = Router()

route.use('/auth', authRoute)

route.use('/exam', examRoute)
export const APIs_v1 = route