import "server-only";
import nodemailer from "nodemailer";
import { z } from "zod";
import { authConfig } from "@/config/auth";
import { HttpError, logServiceError } from "./errors";

function mailSettings() {
  const result = z.object({
    host: z.string().min(1), port: z.coerce.number().int().min(1).max(65535),
    secure: z.enum(["true", "false"]), user: z.string().min(1), password: z.string().min(1),
    from: z.email(),
  }).safeParse({
    host: process.env.SMTP_HOST, port: process.env.SMTP_PORT || "587",
    secure: process.env.SMTP_SECURE || "false", user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD, from: process.env.OTP_FROM_EMAIL,
  });
  if (!result.success) throw new HttpError(503, "O envio de códigos por e-mail ainda não foi configurado.");
  return result.data;
}

export function assertMailerConfigured() {
  mailSettings();
}

export async function sendOtpEmail(email: string, code: string) {
  const config = mailSettings();
  const transport = nodemailer.createTransport({
    host: config.host, port: config.port, secure: config.secure === "true",
    requireTLS: config.secure !== "true",
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
    logger: false, debug: false,
  });
  try {
    await transport.sendMail({
    from: { name: "Tonebook", address: config.from },
    to: email,
    subject: "Seu código de acesso ao Tonebook",
    text: `Seu código de acesso ao Tonebook é: ${code}\n\nEle expira em ${authConfig.codeLifetimeMs / 60_000} minutos e pode ser usado apenas uma vez.\nNão compartilhe este código. Se você não solicitou o acesso, ignore este e-mail.`,
    html: `<div style="font-family:system-ui,sans-serif;color:#28382b;max-width:480px;margin:auto;padding:32px"><h1 style="font-size:24px">tonebook.</h1><p>Seu código de acesso:</p><p style="font:700 36px monospace;letter-spacing:8px;background:#edf2e5;padding:20px;text-align:center">${code}</p><p>Válido por ${authConfig.codeLifetimeMs / 60_000} minutos, para um único acesso.</p><p style="font-size:12px;color:#70786a">Não compartilhe este código. Se você não solicitou o acesso, ignore este e-mail.</p></div>`,
    });
  } catch (error) {
    logServiceError("smtp", error);
    if ((error as { code?: string })?.code === "EAUTH") {
      throw new HttpError(503, config.host === "smtp.gmail.com"
        ? "O Gmail recusou a autenticação. Confira o endereço de envio e a senha de app configurada no servidor."
        : "O serviço de e-mail recusou a autenticação. Confira as credenciais SMTP do servidor.");
    }
    throw new HttpError(503, "Não foi possível conectar ao serviço de envio. Aguarde um minuto e tente novamente.");
  } finally { transport.close(); }
}
