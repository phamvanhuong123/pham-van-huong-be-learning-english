import { Router } from 'express'

import authRoute from '@/routes/v1/authRoutes'
import examRoute from '@/routes/v1/examRoutes'
import questionRoute from '@/routes/v1/questionRoutes'
import clientExamRoute from '@/routes/v1/clientExamRoutes'
import resultRoute from '@/routes/v1/resultRoutes'
import adminRoute from '@/routes/v1/adminRoutes'

const route = Router()

route.use('/auth', authRoute)

route.use('/exam', examRoute)

route.use('/question', questionRoute)

route.use('/client-exam', clientExamRoute)

route.use('/results', resultRoute)

route.use('/admin', adminRoute)

export const APIs_v1 = route