# Testes unitários

Execute `npm test` para rodar a suíte e `npm run test:coverage` para gerar
cobertura dos quatro utilitários e dos três serviços de transações.
O relatório HTML fica em `coverage/index.html`.

A configuração usa Jest com o preset `jest-expo` do SDK 58 e o alias `@/`.
Os testes não precisam do Expo iniciado nem de um aparelho.

## Limites e regra de sobra

Os serviços reais são executados com persistência e predicados SQL substituídos
pelo executor em memória de `src/test-support/transaction-store.ts`.
Os testes verificam as regras, os filtros por grupo/mês e os resultados dos saldos;
não validam SQL gerado pelo Drizzle, o driver SQLite, concorrência ou rollback nativo.
A persistência no aparelho continua dependendo de teste de integração/manual.

A regra atual transporta apenas o resultado próprio de M-1, descontando despesas
e Caixinha e limitando o transporte ao mínimo de zero. Ela não acumula a sobra
recebida de meses anteriores. O teste Nov → Dez → Jan registra esse comportamento.
Há um `test.todo` explícito para a regra alternativa de consumo acumulado:
receita de 1.000 em novembro e despesas de 300 em dezembro e 200 em janeiro
resultariam em 700 e 500 com acumulação; hoje resultam em 700 e -200.
Nenhuma fórmula de produção foi alterada para adaptar esse cenário.

Os testes de floats usam `toBeCloseTo` com dez casas para tolerar apenas resíduos
binários muito menores que um centavo. Isso não implementa nem garante um novo
arredondamento na aplicação.

Validações adicionais: `npx tsc --noEmit` e `npx expo lint`.
