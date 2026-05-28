import { Router } from 'express'

import authRoute from '@/routes/v1/authRoutes'
import examRoute from '@/routes/v1/examRoutes'
import questionRoute from '@/routes/v1/questionRoutes'
import clientExamRoute from '@/routes/v1/clientExamRoutes'
import resultRoute from '@/routes/v1/resultRoutes'
import adminRoute from '@/routes/v1/adminRoutes'
import vocabRoute from '@/routes/v1/vocabRoutes'
import subscriptionRoute from '@/routes/v1/subscriptionRoutes'
import notificationRoute from '@/routes/v1/notificationRoutes'
import profileRoute from '@/routes/v1/profileRoutes'
import sessionRoute from '@/routes/v1/sessionRoutes'
import aiRoute from '@/routes/v1/aiRoutes'

const route = Router()

import grammarRoute from '@/routes/v1/grammarRoutes'

route.use('/auth', authRoute)
route.use('/exam', examRoute)
route.use('/question', questionRoute)
route.use('/client-exam', clientExamRoute)
route.use('/results', resultRoute)
route.use('/admin', adminRoute)
route.use('/vocab', vocabRoute)
route.use('/subscription', subscriptionRoute)
route.use('/grammar', grammarRoute)
route.use('/notifications', notificationRoute)
route.use('/profile', profileRoute)
route.use('/sessions', sessionRoute)
route.use('/ai', aiRoute)

export const APIs_v1 = route