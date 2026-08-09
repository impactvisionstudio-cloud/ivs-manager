export const PROSPECCAO_MENSAGENS: { id: 1 | 2 | 3; template: string }[] = [
  {
    id: 1,
    template:
      "Olá! Tudo bem?\nEstava analisando a [Empresa] de vocês e percebi uma coisa interessante na presença digital de vocês.\nInclusive, tive uma ideia que poderia valorizar bastante a empresa.\nPosso te mostrar?",
  },
  {
    id: 2,
    template:
      "Olá! Tudo certo?\nConheci a [Empresa] e, analisando um pouco a presença de vocês na internet, tive uma ideia que acredito que poderia fazer bastante diferença.\nÉ algo bem simples, mas pode valorizar bastante a imagem da empresa.\nPosso te mostrar?",
  },
  {
    id: 3,
    template:
      "Olá! Tudo bem?\nEstava dando uma olhada na [Empresa] e notei alguns detalhes na presença digital de vocês que me chamaram atenção.\nInclusive, pensei em uma ideia que pode deixar a empresa ainda mais valorizada no digital.\nPosso te mostrar?",
  },
];

export function sortearMensagem(empresa: string): { messageId: 1 | 2 | 3; text: string } {
  const escolhida = PROSPECCAO_MENSAGENS[Math.floor(Math.random() * PROSPECCAO_MENSAGENS.length)];
  return { messageId: escolhida.id, text: escolhida.template.replaceAll("[Empresa]", empresa) };
}
