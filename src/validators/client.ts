
import { z } from "zod";

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres.")
    .regex(
      /^[\p{L}\p{M}\s.'-]+$/u,
      "O nome deve conter apenas letras e caracteres válidos."
    ),

  phone: z
    .string()
    .trim()
    .min(10, "Informe um telefone válido.")
    .max(20, "O telefone é muito longo.")
    .regex(
      /^[0-9()+\-\s]+$/,
      "O telefone contém caracteres inválidos."
    ),

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(254, "O e-mail é muito longo.")
    .transform((value) => value.toLowerCase()),

  address: z
    .string()
    .trim()
    .min(5, "Informe um endereço válido.")
    .max(250, "O endereço deve ter no máximo 250 caracteres."),
});

export type ClientValidated = z.infer<typeof clientSchema>;
