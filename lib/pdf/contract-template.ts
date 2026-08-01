import jsPDF from "jspdf";

export interface ContractPdfData {
  title: string;
  clientName: string;
  clientDocument?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  serviceDescription?: string;
  value?: number;
  paymentType?: "integral" | "entrada";
  date?: string; // ISO date string (data do contrato)
}

interface Section {
  heading: string;
  body: string;
}

const FIXED_SECTIONS: Section[] = [
  {
    heading: "1. OBJETO DO CONTRATO",
    body:
      "1.1. A CONTRATADA compromete-se a prestar ao CONTRATANTE os serviços previamente contratados, podendo incluir, entre outros: produção de vídeos institucionais; produção de vídeos comerciais; captação de imagens; fotografia profissional; produção de Reels, Shorts e TikToks; cobertura de eventos; produção de conteúdo para redes sociais; direção criativa; roteirização; edição de vídeo; tratamento e edição de fotografias; gestão de redes sociais; planejamento de conteúdo; criação de identidade visual; desenvolvimento de artes digitais, cartão de visita, convites; criação de estratégias para posicionamento digital; desenvolvimento de landing pages e websites; outros serviços previamente acordados entre as partes.\n\n1.2. O escopo específico do projeto será descrito na proposta comercial, orçamento, briefing ou ordem de serviço enviada ao CONTRATANTE, fazendo parte integrante deste contrato.\n\n1.3. Qualquer serviço não previsto inicialmente será considerado serviço adicional e dependerá de novo orçamento e aprovação do CONTRATANTE.",
  },
  {
    heading: "2. RESPONSABILIDADES DA CONTRATADA",
    body:
      "2.1. Executar os serviços com qualidade técnica, criatividade e profissionalismo.\n\n2.2. Cumprir os prazos acordados, desde que todas as informações e materiais necessários sejam entregues pelo CONTRATANTE.\n\n2.3. Manter absoluto sigilo sobre informações estratégicas, documentos e materiais fornecidos pelo CONTRATANTE.\n\n2.4. Informar previamente qualquer situação que possa impactar o cronograma.\n\n2.5. Realizar até 02 (duas) rodadas de alterações sem custo adicional, desde que estejam dentro do escopo contratado. Alterações adicionais poderão ser cobradas conforme tabela vigente da CONTRATADA.",
  },
  {
    heading: "3. RESPONSABILIDADES DO CONTRATANTE",
    body:
      "3.1. Fornecer todas as informações necessárias para execução dos serviços.\n\n3.2. Disponibilizar acesso aos locais de gravação, quando necessário.\n\n3.3. Cumprir os horários previamente agendados.\n\n3.4. Efetuar os pagamentos conforme acordado.\n\n3.5. Responder solicitações e aprovações em tempo hábil para não comprometer os prazos.\n\n3.6. Caso haja atraso na entrega de materiais ou aprovações, o cronograma será automaticamente reajustado.",
  },
  {
    heading: "4. PRAZOS",
    body:
      "4.1. Os prazos serão definidos conforme cada projeto.\n\n4.2. O prazo começa a contar somente após: assinatura deste contrato; aprovação do orçamento; confirmação do pagamento inicial (quando houver); envio de todo material necessário.\n\n4.3. Atrasos causados pelo CONTRATANTE suspendem automaticamente os prazos da CONTRATADA.",
  },
  // 5. PAGAMENTO é gerado dinamicamente (ver buildPaymentSection)
  {
    heading: "6. CANCELAMENTO",
    body:
      "6.1. Caso o CONTRATANTE cancele o projeto após sua aprovação: valores já pagos não serão devolvidos; serviços já executados serão cobrados proporcionalmente.\n\n6.2. Caso o cancelamento ocorra durante gravações ou produção, poderão ser cobrados custos operacionais, deslocamento, equipe, locações e equipamentos.",
  },
  {
    heading: "7. DIREITOS AUTORAIS E USO DE IMAGEM",
    body:
      "7.1. Os direitos patrimoniais sobre os materiais produzidos serão transferidos ao CONTRATANTE após a quitação integral do contrato.\n\n7.2. A CONTRATADA poderá utilizar fotos, vídeos e materiais produzidos para divulgação em: portfólio; website; redes sociais; apresentações comerciais; premiações; materiais institucionais. Caso o CONTRATANTE deseje confidencialidade, deverá informar por escrito antes do início do projeto.",
  },
  {
    heading: "8. CONFIDENCIALIDADE",
    body:
      "As partes comprometem-se a manter absoluto sigilo sobre quaisquer informações comerciais, estratégicas ou confidenciais obtidas durante a execução deste contrato.",
  },
  {
    heading: "9. LGPD",
    body:
      "As partes declaram estar de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), comprometendo-se a utilizar os dados apenas para fins relacionados à execução deste contrato.",
  },
  {
    heading: "10. CASO FORTUITO E FORÇA MAIOR",
    body:
      "A CONTRATADA não será responsabilizada por atrasos decorrentes de eventos imprevisíveis, como: chuvas intensas; desastres naturais; greves; problemas de energia; problemas de internet; acidentes; enfermidades; restrições legais; outras situações de força maior.",
  },
  {
    heading: "11. FORO",
    body:
      "Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer dúvidas oriundas deste contrato, renunciando as partes a qualquer outro, por mais privilegiado que seja.",
  },
  {
    heading: "12. ACEITE ELETRÔNICO",
    body:
      "12.1. As partes concordam que este contrato poderá ser assinado eletronicamente por plataforma digital escolhida pela CONTRATADA.\n\n12.2. A assinatura eletrônica possui a mesma validade jurídica da assinatura física.\n\n12.3. Após a assinatura eletrônica, ambas as partes receberão uma cópia deste contrato.",
  },
];

function formatMoney(value?: number) {
  if (value === undefined) return "a combinar";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildPaymentSection(data: ContractPdfData): Section {
  const total = formatMoney(data.value);
  const paymentLines =
    data.paymentType === "entrada"
      ? `● 50% (${
          data.value ? formatMoney(data.value / 2) : "metade do valor"
        }) na contratação;\n● 50% restante na entrega do material final.`
      : `● Valor integral de ${total} pago na contratação.`;

  return {
    heading: "5. PAGAMENTO",
    body:
      `5.1. O valor total dos serviços contratados é de ${total}, conforme a proposta comercial/plano contratado.\n\n` +
      `5.2. Forma de pagamento acordada:\n${paymentLines}\n\n` +
      `5.3. Em caso de atraso superior a 5 dias: multa de 2%; juros de 1% ao mês; correção monetária.\n\n` +
      `5.4. Enquanto houver inadimplência, a CONTRATADA poderá suspender qualquer entrega ou serviço.`,
  };
}

export function generateContractPdf(data: ContractPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 14;
  let y = margin;

  function ensureSpace(nextBlockHeight: number) {
    if (y + nextBlockHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function writeParagraph(text: string, opts?: { bold?: boolean; size?: number; center?: boolean }) {
    const size = opts?.size ?? 10;
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      ensureSpace(lineHeight);
      if (opts?.center) {
        doc.text(line, pageWidth / 2, y, { align: "center" });
      } else {
        doc.text(line, margin, y);
      }
      y += lineHeight;
    }
  }

  // Cabeçalho
  writeParagraph("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", { bold: true, size: 14, center: true });
  writeParagraph("IMPACT VISION STUDIO (IVS)", { bold: true, size: 12, center: true });
  y += 10;

  writeParagraph(
    "Pelo presente instrumento particular, de um lado, IMPACT VISION STUDIO (IVS), doravante denominada CONTRATADA, e, de outro lado, o cliente identificado ao final deste contrato, doravante denominado CONTRATANTE, têm entre si justo e contratado o presente Contrato de Prestação de Serviços de Produção Audiovisual e Marketing Digital, que será regido pelas cláusulas e condições abaixo."
  );
  y += 8;

  if (data.serviceDescription) {
    writeParagraph("SERVIÇO/PLANO CONTRATADO", { bold: true, size: 11 });
    writeParagraph(data.serviceDescription);
    y += 8;
  }

  // Seções fixas + pagamento dinâmico, na ordem original
  const orderedSections: Section[] = [
    FIXED_SECTIONS[0],
    FIXED_SECTIONS[1],
    FIXED_SECTIONS[2],
    FIXED_SECTIONS[3],
    buildPaymentSection(data),
    ...FIXED_SECTIONS.slice(4),
  ];

  for (const section of orderedSections) {
    ensureSpace(lineHeight * 2);
    writeParagraph(section.heading, { bold: true, size: 11 });
    writeParagraph(section.body);
    y += 8;
  }

  // Dados das partes
  ensureSpace(lineHeight * 10);
  writeParagraph("DADOS DA CONTRATADA", { bold: true, size: 11 });
  writeParagraph("IMPACT VISION STUDIO (IVS)");
  writeParagraph("Responsável: Daniel Gomes");
  writeParagraph("Telefone: (11) 95927-1188");
  writeParagraph("E-mail: visionstudioimpact@gmail.com");
  writeParagraph("Website: https://impactvision.framer.ai/");
  y += 12;

  writeParagraph("DADOS DO CONTRATANTE", { bold: true, size: 11 });
  writeParagraph(`Nome/Razão Social: ${data.clientName}`);
  writeParagraph(`CPF/CNPJ: ${data.clientDocument ?? "________________________"}`);
  writeParagraph(`Endereço: ${data.clientAddress ?? "________________________"}`);
  writeParagraph(`Telefone: ${data.clientPhone ?? "________________________"}`);
  writeParagraph(`E-mail: ${data.clientEmail ?? "________________________"}`);
  writeParagraph(`Data: ${data.date ? new Date(data.date).toLocaleDateString("pt-BR") : "___/___/______"}`);
  y += 20;

  ensureSpace(lineHeight * 4);
  writeParagraph("_______________________________________", { center: true });
  writeParagraph("CONTRATANTE", { center: true });
  y += 16;
  writeParagraph("_______________________________________", { center: true });
  writeParagraph("IMPACT VISION STUDIO (IVS)", { center: true });

  const safeClientName = data.clientName?.trim() || "contrato";
  const fileName = `contrato-${safeClientName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  doc.save(fileName);
}