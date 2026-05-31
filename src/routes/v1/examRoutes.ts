import { examController } from "@/controllers/examController";
import { examValidator } from "@/validators/examValidator";
import { Router, Request, Response } from "express";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";

const route = Router()

route.use(authenticate);

route.get('/status', (req: Request, res: Response) => {
    res.json({
        message: 'ok'
    })
})
route.post('/', authorize('exam.manage'), examValidator.createExam, examController.createExam)
route.get('/', examController.getListExam)
route.delete('/:id', authorize('exam.manage'), examController.deleteExam)
route.put('/:id', authorize('exam.manage'), examValidator.updateExam, examController.updateExam)

export default route