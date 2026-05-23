import { examController } from "@/controllers/examController";
import { examValidator } from "@/validators/examValidator";
import { Router, Request, Response } from "express";

const route = Router()

route.get('/status', (req: Request, res: Response) => {
    res.json({
        message: 'ok'
    })
})
route.post('/', examValidator.createExam, examController.createExam)
route.get('/', examController.getListExam)
route.delete('/:id', examController.deleteExam)
route.put('/:id', examValidator.updateExam, examController.updateExam)

export default route