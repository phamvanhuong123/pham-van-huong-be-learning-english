import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").regex(/\d/, "Mật khẩu phải chứa ít nhất 1 chữ số"),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token không hợp lệ"),
  newPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").regex(/\d/, "Mật khẩu phải chứa ít nhất 1 chữ số"),
});
