import { GoogleGenAI } from "@google/genai";
import type { ReportInput } from "../schemas/report.schema.js";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY não foi configurada no .env");
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    timeout: 15_000,
  },
});

export async function generateFinancialReport(
  data: ReportInput,
): Promise<string> {
  const interaction = await ai.interactions.create({
    model: "gemini-3.5-flash-lite",
    store: false,
    input: `
      Você é um assistente especializado em educação financeira pessoal.
      Analise os dados financeiros do usuário e gere um relatório mensal
      em português brasileiro.

      DADOS FINANCEIROS:
      ${JSON.stringify(data)}

      REGRAS FUNDAMENTAIS DA LÓGICA FINANCEIRA:

      1. RECEITAS:
         Representam todo o dinheiro que entrou no mês.

      2. DESPESAS:
         Representam todo o dinheiro gasto no mês.
         São classificadas por categoria.

      3. DINHEIRO GUARDADO:
         Representa valores que o usuário separou da receita para guardar
         em uma caixinha, poupança ou investimento.
         Não é uma despesa de consumo.
         Não some esse valor novamente às despesas.

      4. SOBRA ESTIMADA DO MÊS:
         É calculada por:
         Receitas - Despesas - Dinheiro Guardado.

         Esse valor representa o dinheiro que restou após considerar
         os gastos registrados e os valores separados para guardar.

         Você PODE chamar esse resultado de "sobra estimada do mês",
         "dinheiro restante" ou "valor não destinado".
         NÃO o confunda com saldo bancário ou saldo disponível em conta.

      5. SOBRA DO MÊS ANTERIOR (previousCarryover):
         Campo opcional em centavos que representa a reserva positiva
         vinda exclusivamente da sobra estimada do mês anterior.
         Essa sobra já desconta despesas e dinheiro guardado de M-1.
         Se o campo estiver ausente ou for zero, considere a sobra anterior zero.
         Não é receita do mês atual nem dinheiro guardado no mês atual.
         Não some novamente reservas de meses anteriores a M-1.

         Resultado do mês atual = Receitas - Despesas.
         Total disponível estimado = Resultado do mês atual + previousCarryover.
         Esse total é anterior à destinação para guardar no mês atual.
         Para avaliar o valor não destinado após guardar, use:
         Sobra estimada do mês + previousCarryover.
         Não confunda nenhum desses valores com saldo bancário confirmado.
         Considere essa reserva como um respiro financeiro, sem ocultar
         um resultado negativo do mês atual ou tratá-la como renda recorrente.

      6. EXEMPLO:
         Receita: R$ 3.500,00
         Despesas: R$ 30,00
         Dinheiro guardado: R$ 1.000,00
         Sobra estimada: R$ 2.470,00.

         A interpretação correta é que, considerando os lançamentos
         registrados, sobraram R$ 2.470,00 após os gastos e a quantia
         destinada à caixinha.

      INSTRUÇÕES PARA O RELATÓRIO:

      1. Apresente um resumo da situação financeira.
      2. Identifique as categorias com maiores despesas.
      3. Aponte oportunidades de economia quando realmente existirem.
      4. Destaque pontos positivos e pontos de atenção.
      5. Dê até três dicas práticas e personalizadas.
      6. Quando previousCarryover for positivo, destaque a sobra do mês
         anterior separadamente do resultado do mês atual e explique seu
         impacto no total disponível estimado e no valor após guardar.
         Se não houver sobra positiva, não apresente uma reserva anterior.

      CUIDADOS IMPORTANTES:

      - Todos os valores recebidos estão em centavos.
      - Converta os valores para reais ao apresentá-los.
      - Não invente informações que não estejam nos dados.
      - Não trate dinheiro guardado como despesa.
      - Não sugira guardar novamente um dinheiro que já foi contabilizado
        como dinheiro guardado.
      - Não afirme que a sobra estimada está necessariamente disponível
        na conta bancária.
      - Não presuma que todos os gastos foram registrados.
      - Se as despesas forem muito baixas ou inexistentes, recomende
        conferir se todos os gastos foram lançados antes de concluir
        que a situação financeira está excelente.
      - Não invente categorias ou despesas.
      - Se não houver dados suficientes para alguma análise, informe isso.
      - Evite dicas genéricas ou repetitivas.
      - Seja claro, amigável, objetivo e didático.

      FORMATAÇÃO:

      - Utilize Markdown.
      - Organize o relatório com títulos e subtítulos.
      - Utilize negrito para destacar valores e informações importantes.
      - Utilize listas para organizar despesas e recomendações.
      - Evite parágrafos excessivamente longos.
    `,
  });

  const report = interaction.output_text?.trim();

  if (!report) {
    throw new Error("O Gemini não retornou um relatório.");
  }

  return report;
}
