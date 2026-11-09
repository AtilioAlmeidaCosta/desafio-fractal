/**
 * Normaliza o nome do cabeçalho removendo acentos e pontuações,
 * mapeando variações comuns (inclusive mojibake) para a chave padrão.
 */
export function normalizeHeaderKey(header: string): string {
  const cleaned = header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (cleaned.startsWith("nom")) return "name";
  if (cleaned.startsWith("tel")) return "phone";
  if (cleaned.startsWith("em") || cleaned.startsWith("mail")) return "email";
  if (cleaned.startsWith("ender") || cleaned.includes("end")) return "address";

  return header.trim();
}

/**
 * Corrige mojibake se o texto UTF-8 tiver sido interpretado indevidamente como Latin-1 (Windows-1252/ISO-8859-1).
 */
export function sanitizeEncoding(text: string): string {
  if (!text) return "";
  
  // Se contiver padrões clássicos de interpretação incorreta UTF-8 como ISO-8859-1
  if (/[\u00C2\u00C3]/.test(text)) {
    try {
      const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0));
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return decoded.trim();
    } catch {
      // Se a conversão falhar, preserva o texto original tratado
      return text.trim();
    }
  }

  return text.trim();
}