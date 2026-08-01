export const PLAN_CHECKLISTS: Record<string, string[]> = {
  Essencial: [
    "Site premium",
    "Copy estratégica",
    "SEO base",
    "WhatsApp preparado",
  ],
  Premium: [
    "Site ou landing premium",
    "Branding visual",
    "Produção audiovisual",
    "SEO e integrações",
    "Funil para WhatsApp",
  ],
  Impact: [
    "Experiência completa",
    "Marketing e automações",
    "SEO avançado",
    "Audiovisual comercial",
    "Consultoria estratégica",
  ],
};

/**
 * Detecta qual plano foi escolhido a partir do texto livre digitado no
 * campo "Serviço/plano contratado" do contrato. Procura pelo nome do
 * plano (Essencial, Premium, Impact) em qualquer parte do texto,
 * sem diferenciar maiúsculas/minúsculas.
 */
export function detectPlan(serviceDescription: string | undefined | null): string | null {
  if (!serviceDescription) return null;
  const text = serviceDescription.toLowerCase();
  for (const planName of Object.keys(PLAN_CHECKLISTS)) {
    if (text.includes(planName.toLowerCase())) {
      return planName;
    }
  }
  return null;
}