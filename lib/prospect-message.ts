export function renderProspectMessage(
  template: string,
  lead: { companyName: string; niche?: string | null; phone: string }
) {
  return template
    .replaceAll("{{empresa}}", lead.companyName)
    .replaceAll("{{nicho}}", lead.niche || "")
    .replaceAll("{{telefone}}", lead.phone);
}

export function buildWhatsAppLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}