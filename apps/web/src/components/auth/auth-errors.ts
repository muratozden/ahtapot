const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-posta veya şifre hatalı.",
  INVALID_EMAIL: "Geçerli bir e-posta adresi gir.",
  INVALID_PASSWORD: "Şifre hatalı.",
  PASSWORD_TOO_SHORT: "Şifre en az 8 karakter olmalı.",
  PASSWORD_TOO_LONG: "Şifre çok uzun.",
  USER_ALREADY_EXISTS: "Bu e-posta ile kayıtlı bir hesap var.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Bu e-posta ile kayıtlı bir hesap var.",
};

export function authErrorMessage(error: { code?: string; status?: number }) {
  if (error.status === 429) return "Çok fazla deneme yaptın. Biraz bekleyip tekrar dene.";
  return (error.code && messages[error.code]) || "Bir şeyler ters gitti. Lütfen tekrar dene.";
}

export function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/";
}
