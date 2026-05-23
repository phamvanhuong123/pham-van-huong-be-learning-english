import { authController } from "@/controllers/authController";
import { authValidator } from "@/validators/authValidator";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

const route = Router()

route.get('/status', (req, res) => { res.status(StatusCodes.OK).json({messge : "ok"})})

//login
route.post('/login',authController.login)

//logout
route.delete('/logout', authController.logout)

//refresh token
route.put('/refresh-token', authController.refreshToken)

//register
route.post('/register',authValidator.register,authController.register)
//verify-email
route.get('/verify-email', authController.verifyEmail);

export default route