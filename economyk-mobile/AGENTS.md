# EconomyK Mobile

App pessoal de controle financeiro (React Native, Expo, TypeScript, Expo Router, expo-sqlite + Drizzle).
Trabalhe somente dentro de `economyk-mobile`. Não leia nem altere `../economyk-api`.
Responda sempre em português brasileiro, de forma objetiva.

## Expo muda a cada SDK
Antes de mexer em qualquer API do Expo, EAS ou React Native:
1. Veja a versão do `expo` no `package.json`.
2. Consulte https://docs.expo.dev/versions/v<major>.0.0/ ou https://docs.expo.dev/llms.txt
Nunca responda de memória sobre APIs do Expo.

## Comandos
- `npx expo install <pacote>` para instalar (nunca npm/yarn add)
- `npx expo lint` e `npx tsc --noEmit` antes de dar qualquer tarefa como concluída
- Não inicie nem reinicie o Expo (`expo start`) sem eu pedir

## Rotas
Expo Router. Rotas ficam só em `src/app/`. Componentes, hooks e utils ficam fora dela.

## Regras de negócio que NÃO podem quebrar
- Parcelas: `installmentNumber`, `totalInstallments`, `installmentGroupId`. Bug já corrigido: ao editar parcelada para comum, a transação continuava parcelada. Ao remover o parcelamento, limpar todos os metadados.
- Fixas: `isFixed`, `fixedGroupId` e a lógica de `fixedGroupClosures` (em `src/db/schema.ts` e nos serviços). Não remover nem simplificar. Evitar duplicatas ao gerar meses futuros e preservar o histórico dos meses anteriores.
- Fixa não é transação comum, mesmo compartilhando atributos.
- Categorias: sem vazias, sem duplicadas, renomear atualiza as transações, não excluir categoria em uso.
- `src/utils/balance.ts` é camada de compatibilidade: não remover.
- `src/components/financial-summary.tsx` (home) e `src/components/analytics/financial-summary.tsx` são componentes diferentes.
- Não invente fórmulas financeiras novas.

## Proibido sem minha autorização
- Mexer no banco (nome, tabelas, colunas, IDs, migrações) ou apagar dados.
- Mexer em `src/services/backup-service.ts` ou na comunicação com a API (`src/config/api.ts`, `src/services/api-wakeup.ts`, `src/services/financial-report*.ts`).
- Excluir arquivos: liste os candidatos com justificativa e espere minha aprovação.
- Arquivos `*.web.tsx` e `*.web.ts` não são código morto (o Metro escolhe por plataforma).
- Não excluir `android/`, assets do `app.json`, config do EAS, arquivos de declaração `.d.ts`.
- Comandos destrutivos (`git reset --hard`, `git clean`, etc.) e descartar mudanças da branch.
- Fazer commit: quem commita sou eu.
- Implementar web nova, Supabase, login, sincronização ou backend. Isso é planejado à parte.

## Estilo
- Não mudar visual (cores, espaçamento, animações, navegação) nem comportamento de formulários.
- Código simples, tipado, sem `any`, sem dependências novas, sem abstrações sem benefício.
- Remover comentários óbvios nos arquivos que você editar, mantendo os que explicam decisões não óbvias.
- Não afirme que algo funciona sem verificar. Diga o que foi verificado e o que depende de teste manual no aparelho.
