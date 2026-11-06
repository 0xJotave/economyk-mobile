# Auditoria da refatoração — fase 1

Data: 06/11/2026. Branch: `refactor/front`.

## Escopo e verificações

Leitura da home, dos oito componentes solicitados, dos quatro serviços de transações, de todos os hooks e utils. Leitura complementar de tipos, schema/inicialização do banco, layout e rota Explore para conferir contratos e dependências. Importadores verificados com `git grep`, incluindo `git grep --untracked` para as extrações ainda não rastreadas. Ignorados `node_modules`, `android/build` e `.expo`. Não acessado `../economyk-api`.

- `git status --short`: 13 arquivos rastreados modificados; cinco componentes novos, `src/features/` e dois utils ainda não rastreados. Nenhuma alteração staged.
- `git diff --stat`: 13 arquivos, 1.069 inserções e 1.053 exclusões. Esse total não inclui arquivos novos. É a comparação do diretório de trabalho com o índice, não uma comparação com uma branch-base, que não foi especificada.
- Mudanças preexistentes incluem `AGENTS.md`, `package.json` e `package-lock.json`; a dependência adicionada no diff inicial é `@expo/ngrok`.
- `npx tsc --noEmit`: concluído, código 0, sem erros de tipos.
- `CI=1 npx expo lint`: não chegou a analisar o código. Sem configuração ESLint e sem dependências ESLint, o CLI iniciou instalação automática de `eslint` e `eslint-config-expo`. A execução foi interrompida (130), e somente as duas entradas acrescentadas automaticamente ao `package.json` foram revertidas. O diff final de package e lock voltou ao resumo inicial. Não houve instalação autorizada nem configuração criada. Lint permanece pendente; não equivale a aprovação.
- Expo declarado: `~58.0.23`. Nenhuma API Expo/React Native foi modificada; não foi iniciado Expo, aberto banco nem executado fluxo financeiro.

Único artefato final desta auditoria: este documento. Nenhuma correção de código, exclusão ou commit.

## Estado da refatoração

**Extrações concluídas no código:**

- `src/app/index.tsx`: apresentação separada em `home-tabs`, `month-navigation`, `financial-summary` e `transactions-content`. Home mantém estados, filtros, callbacks, confirmações e integração com backup.
- `transaction-form.tsx`: campos, tipos, categorias e tratamento do valor extraídos. `transaction-options.tsx` mantém exclusão mútua entre fixa e parcelada e removeu `any` do contrato de estilos.
- `use-transactions.ts`: caiu de 444 para 103 linhas; persistência e decisões foram distribuídas nos quatro serviços.
- `financial-summary.ts` e `analytics-summary.ts`: cálculos extraídos; `balance.ts` preservado como adaptador. Fórmula de saldo continua receita − economia − despesa.
- `use-categories.ts`: valida nomes vazios/duplicados, consulta uso no banco e atualiza transações no rename.

**Parcial:** separação de responsabilidades ainda não resolve atomicidade, concorrência, tratamento de falhas e validação de transições. Modal continua com estado e persistência assíncrona mal coordenados; categorias continuam acessando o banco diretamente no hook. Há alterações funcionais além de extração: novas conversões entre tipos e propagação após edição. Arquivos novos não rastreados precisam acompanhar a entrega; copiar apenas o diff rastreado deixa imports quebrados.

## Problemas por impacto

### 1. Exclusões e recriações sem atomicidade — alto

`installment-service.ts:updateInstallments` apaga a selecionada e futuras antes de inserir substitutas. `fixed-transaction-service.ts:updateFixedTransaction` apaga futuras, altera encerramento e só depois reinsere. `transaction-management-service.ts` também apaga a comum antes de convertê-la em parcelas. Não há transação envolvendo essas sequências. Uma falha de insert ou interrupção pode deixar dados removidos e estado React antigo. O padrão de apagar/recriar já existia parcialmente no hook anterior; as novas conversões ampliam sua exposição.

`closeFixedGroup` faz delete seguido de insert: falha intermediária pode remover a barreira que impedia a recorrência de reaparecer. Renomear categoria também usa dois updates independentes; falha no segundo deixa transações com o nome anterior.

### 2. Reduzir total abaixo da parcela atual apaga a selecionada sem substituição — alto

Em `installment-service.ts:updateInstallments`, editar a parcela 5/12 para total 3 primeiro exclui 5 e posteriores; o loop `i = 5; i <= 3` não executa. Retorna lista vazia, a home fecha o modal como sucesso e a parcela editada desaparece. `transaction-options.tsx` oferece 2–12 sem limite relativo à parcela atual, tornando esse caminho acessível. Deve haver decisão explícita e validação antes da exclusão. Esse problema também é identificável no fluxo anterior ao diff.

### 3. Concorrência pode duplicar fixas e sobrescrever estado — alto

`applyFixedTransactions` calcula ausências a partir do array recebido, consulta encerramentos e insere sem revalidar as ocorrências persistidas. Duas chamadas com o mesmo snapshot podem inserir o mesmo grupo/mês com IDs diferentes; schema não impõe unicidade por grupo/mês. A trava de `handleMonthChange` só protege outra navegação, não salva, remove ou recarrega.

`handleSave` e `handleRemoveTransaction` substituem todo o estado com listas derivadas do snapshot capturado. Operações simultâneas podem persistir ambas no banco, mas deixar apenas uma na tela. É risco demonstrado pela estrutura, sem reprodução de concorrência no aparelho nesta fase.

### 4. IDs de parcelas podem colidir com outras transações — alto, condicional

`createInstallments` usa `Date.now()` para o grupo e `grupo + i` para IDs. Uma transação criada poucos milissegundos depois pode reutilizar um desses números. Fixas usam horário mais número aleatório, sem garantia de unicidade. A chave primária evita sobrescrita silenciosa, mas o insert pode falhar; combinada com exclusão prévia, a falha pode causar perda. Não foi provocada colisão nesta auditoria. Não alterar IDs/schema sem autorização.

### 5. Modal perde dados digitados antes de saber se salvou — médio/alto

`transaction-modal.tsx:handleSave` chama `onSave` tipado como `void` e executa `resetForm()` imediatamente. A implementação real na home retorna Promise. Se o serviço rejeitar, modal fica aberto com formulário limpo, sem mensagem de erro do fluxo de salvar. Os hooks também não tratam falhas de salvar/remover/carregar. Sem estado de salvamento, não há bloqueio explícito de ações concorrentes. O reset antecipado já existia no fluxo anterior.

### 6. Categorias: seleção local muda antes de validar/persistir — médio

`handleEditCategory` do modal troca a categoria selecionada sem aguardar o hook. Ao tentar renomear A para B já existente, o hook recusa, mas o formulário passa a selecionar B; salvar pode recategorizar a transação mesmo com rename recusado. Em erro de banco, pode manter nome inexistente, pois `isValid` só exige categoria não nula. Criação também seleciona o nome antes do insert; exclusão limpa a seleção antes da verificação de uso.

Validação de duplicidade usa o array React; duas inclusões simultâneas com grafias diferentes podem passar. A chave primária por nome não substitui a comparação sem distinguir maiúsculas e minúsculas feita na interface.

### 7. Fixas dependem do mês imediatamente anterior — médio

`utils/fixed.ts` só copia o mês anterior ao destino. Exemplo: última ocorrência em janeiro, reabertura em abril sem fevereiro/março gerados: `loadData` não recupera a recorrência de janeiro. Navegar em sequência pode preencher a lacuna; abrir diretamente o mês corrente não garante isso. Limitação preexistente, sem política nova proposta nesta fase.

### 8. Categorias especiais e recarga vazia — baixo/médio

`analytics-summary.ts` acumula em `{}` com chaves fornecidas pelo usuário. Nomes como `constructor` ou `__proto__` encontram propriedades herdadas; a soma pode deixar de ser numérica e o gráfico ficar incorreto. Padrão já existia antes da extração.

`loadCategories` só atualiza estado quando a consulta retorna itens. Uma recarga após conjunto vazio mantém categorias antigas/defaults em memória, permitindo seleção que não representa o banco. Não foi executada restauração para reproduzir esse cenário.

### 9. Alteração visual preexistente fora da extração — baixo

`src/styles/home.styles.ts:fixedBadge/fixedBadgeText` mudou fundo de `surfaceMuted` para `burgundy + "99"` e texto de `textSecondary` para `cream`. É mudança concreta de cores frente ao HEAD, contrariando a restrição de manter o visual se não houve autorização específica anterior. Nenhuma alteração visual foi feita nesta auditoria.

## Regras do AGENTS.md

| Regra | Resultado da leitura |
| --- | --- |
| Parcelada → comum limpa três metadados | Sim no caminho persistido: `updateInstallments` define `installmentNumber`, `totalInstallments` e `installmentGroupId` como `undefined` no objeto inserido após delete. Parcelas anteriores são preservadas por mês. O modal ainda envia número/grupo antigos; a garantia depende do serviço, não do payload. Falta teste de leitura após reabrir o app. |
| Fixas são distintas de comuns | Sim: caminhos específicos consideram `isFixed` ou `fixedGroupId`; continuam existindo encerramentos e grupo. |
| Fixas sem duplicar | Apenas no fluxo sequencial com snapshot atualizado: grupo presente no destino é descartado. Concorrência e dados já duplicados não estão protegidos. |
| Histórico das fixas | Delete limitado ao mês selecionado e posteriores; anteriores preservados. Encerramento continua consultado. Na conversão fixa → comum, `fromMonth` mudou do mês seguinte no HEAD para o próprio mês editado; alteração semântica que merece teste de navegação/edição histórica. Reabrir uma fixa apaga o encerramento do grupo, exigindo validar efeito sobre meses já encerrados. |
| Categorias sem vazias/duplicadas | `trim` e comparação sem distinguir caixa no hook; fragilidade em concorrência e seleção otimista, descritas acima. |
| Renomear atualiza transações | Sim, update por nome em todos os meses; sem atomicidade com o update da categoria. |
| Não excluir categoria em uso | Sim, consulta no banco com `limit(1)` antes do delete, incluindo meses fora da tela; intervalo entre consulta e delete continua exposto a concorrência. |
| `balance.ts` preservado | Sim, adaptador usado como tipo pelo resumo da home. Não é candidato a exclusão. |
| Dois componentes financial-summary | Mantidos separados: home usa `src/components/financial-summary.tsx`; analytics usa `src/components/analytics/financial-summary.tsx`. |
| Sem fórmulas novas | Saldo e totais preservados na comparação estática. Pendências agora usam `!isConfirmed`, antes `=== false`; para booleanos válidos é equivalente, mas null/undefined importados seriam contados de modo diferente. |
| Rotas apenas em `src/app/` | Extrações observadas ficam fora de `src/app/`; `explore.tsx` continua rota. |
| Sem banco/API/backup alterados | Nenhum desses arquivos aparece no diff inicial; foram preservados nesta auditoria. |
| Sem `any` | Removido de `transaction-options`; ainda existe preexistente em `app-tabs.web.tsx` (`props as any`). `transaction-form` usa `object` para estilos e importa `ThemeColors` sem uso; TypeScript atual não sinalizou. |

## Dependências das extrações

Caminhos abaixo relativos a `src/`; referências incluem imports de tipo.

| Arquivo | Quem importa |
| --- | --- |
| `components/home-tabs.tsx` | `app/index.tsx`, `components/financial-summary.tsx` |
| `components/month-navigation.tsx` | `app/index.tsx` |
| `components/financial-summary.tsx` | `app/index.tsx` |
| `components/transactions-content.tsx` | `app/index.tsx` |
| `components/transaction-modal.tsx` | `app/index.tsx` |
| `components/transaction-form.tsx`, `transaction-options.tsx`, `category-modals.tsx` | `components/transaction-modal.tsx` |
| `features/transactions/services/transaction-management-service.ts` | `hooks/use-transactions.ts` |
| `features/transactions/services/transaction-service.ts`, `installment-service.ts` | `transaction-management-service.ts` |
| `features/transactions/services/fixed-transaction-service.ts` | `transaction-management-service.ts`, `hooks/use-transactions.ts` |
| `hooks/use-categories.ts`, `use-transactions.ts` | `app/index.tsx` |
| `hooks/use-theme.ts` | `app/explore.tsx`, `components/themed-text.tsx`, `themed-view.tsx`, `ui/collapsible.tsx` |
| `hooks/use-color-scheme.ts` e `.web.ts` | `hooks/use-theme.ts`, pelo mesmo caminho base |
| `utils/balance.ts` | `components/financial-summary.tsx` |
| `utils/financial-summary.ts` | `app/index.tsx`, `utils/balance.ts` |
| `utils/analytics-summary.ts` | `components/analytics-view.tsx` |
| `utils/fixed.ts` | `fixed-transaction-service.ts` |
| `utils/month.ts` | `use-transactions.ts`, os serviços de fixa, parcelas e gerenciamento, `utils/fixed.ts` |
| `utils/format.ts` | Resumos da home/analytics, `analytics-view`, `analytics/spending-chart`, `transaction-form` e `transaction-item` |
| `utils/installments.ts`, `utils/labels.ts` | Respectivamente `transaction-item` e `transaction-form` |

## Duplicações e tamanho

- `src/components/transaction-modal.tsx`: 388 linhas, reúne estado de transação/categorias, montagem do payload, animação e estilos. A extração do formulário não encerra essa responsabilidade.
- `src/styles/home.styles.ts`: 421 linhas; componentes extraídos ainda compartilham a folha completa. Tamanho não justifica mudança visual nem divisão automática.
- `src/app/index.tsx`: 277 linhas; continua com fluxos de backup/restauração, filtros e coordenação. A integração existente com backup deve ser preservada; serviço está fora do escopo de edição autorizado.
- `transaction-management-service.ts`: 171 linhas de decisões de conversão, filtros de remoção e propagação. Melhor priorizar integridade antes de fragmentar mais.
- `use-categories.ts`: 154 linhas com validação, banco, estado e alerts. Modal repete trim/busca de categorias e antecipa resultados.
- Loops de criação/edição de parcelas repetem montagem e avanço do mês; avanço recalcula desde o mês inicial a cada item. Com limite de 12, custo pequeno; risco principal é divergência entre caminhos.
- Totalização mensal se repete em `financial-summary.ts` e `analytics-summary.ts`; agrupamento de despesas é exclusivo de analytics. Não alterar fórmula para eliminar duplicação.
- Tipos `ActiveTab` repetidos em `home-tabs` e `transactions-content`; `FilterType` repetido em `transactions-content` e `transactions-filter`.

## Candidatos do template e arquivos sem consumidores

Ausência de import não basta para rotas, resolução por plataforma, imagens por densidade e configuração. “Candidato” não autoriza remoção. Nenhum arquivo foi excluído.

| Arquivo ou família | Quem importa/referencia | Rota/plataforma | Seguro remover? |
| --- | --- | --- | --- |
| `src/app/explore.tsx` | `app-tabs.web.tsx` aponta para `/explore`; descoberta por arquivo | Rota | Não isoladamente; altera navegação existente. |
| `src/components/hint-row.tsx` | Nenhum consumidor encontrado por caminho/símbolo | Não | Candidato de baixo risco, somente após aprovação. |
| `src/components/external-link.tsx` | `explore.tsx`, `app-tabs.web.tsx` | Comum, usado na web | Não. |
| `src/components/themed-text.tsx` | `explore`, `app-tabs.web`, `hint-row`, `ui/collapsible`, `web-badge` | Comum | Não. |
| `src/components/themed-view.tsx` | `explore`, `app-tabs.web`, `hint-row`, `ui/collapsible`, `web-badge` | Comum | Não. |
| `src/components/ui/collapsible.tsx` | `explore.tsx` | Não | Não enquanto Explore existir. |
| `src/components/web-badge.tsx` | `explore.tsx` | Renderizado na web, arquivo comum | Não enquanto esse uso existir. |
| `src/hooks/use-theme.ts` | Explore, themed-text/view e collapsible | Comum | Não. |
| `src/hooks/use-color-scheme.ts` e `.web.ts` | `use-theme.ts` pelo caminho base | Variante web | Não; preservar ambas as resoluções. |
| `src/constants/theme.ts` | Explore, app-tabs.web, themed-text/view, hint-row, collapsible e use-theme | Comum | Não. |
| `src/components/app-tabs.tsx` e `.web.tsx` | `src/app/_layout.tsx` pelo caminho base | Variante web | Não; navegação ativa. |
| `src/components/animated-icon.tsx` e `.web.tsx` | `src/app/_layout.tsx` pelo caminho base | Variante web | Não; splash ativo. |
| `src/components/animated-icon.module.css` | `animated-icon.web.tsx` | Estilo da variante web | Não. |
| `assets/images/expo-logo.png` | Ambas as variantes animated-icon; também lista do reset | Asset | Não; splash usa. |
| `assets/images/expo-badge.png`, `expo-badge-white.png` | `web-badge.tsx`; lista do reset | Assets | Não enquanto WebBadge existir. |
| `assets/images/tutorial-web.png` | `explore.tsx`; lista do reset | Asset | Não enquanto Explore existir. |
| `assets/images/react-logo.png`, `react-logo@2x.png`, `react-logo@3x.png` | Require base em Explore; lista do reset | Assets com variantes de densidade | Não isoladamente; variantes fazem parte da mesma imagem. |
| `assets/images/tabIcons/*` | Somente lista do reset encontrada | Assets com variantes | Candidatos sem consumidor de runtime identificado; validar build/config antes de aprovar. |
| `assets/images/android-icon-background.png`, `android-icon-foreground.png`, `android-icon-monochrome.png`, `icon.svg` | Sem referência na busca textual; `app.json` usa `icon.png` | Assets | Apenas candidatos a inspeção; falta conferir referências nativas antes de afirmar remoção segura. |
| `assets/images/icon.png`, `favicon.png`, `splash-icon.png`, `assets/expo.icon/*` | `app.json` referencia diretamente ou por diretório | Config/asset | Não; protegidos pelo AGENTS.md. |
| `scripts/reset-project.js` | Script `reset-project` no package e README | Script | Não isoladamente; candidato a retirada coordenada após aprovação. Não executar durante auditoria. |
| `src/components/floating-theme-button.tsx` | Nenhum consumidor encontrado por caminho/símbolo | Comum, não necessariamente template | Candidato sem uso estático; confirmar intenção antes de excluir. |
| `src/components/theme-toggle-button.tsx` | Nenhum import encontrado | Comum, não necessariamente template | Candidato sem uso estático; confirmar intenção. |
| `src/data/mock-data.ts` | Nenhum import pelo caminho encontrado | Dados, não rota/plataforma | Candidato; não confundir com dados persistidos. |

`android/`, configuração EAS, declarações `.d.ts` e `balance.ts` não são candidatos de limpeza. As referências nativas dos assets não foram integralmente auditadas; a tabela explicita essa limitação.

## Riscos de regressão e validação pendente

Não houve teste de interface nem de persistência em aparelho. TypeScript não valida atomicidade, closures, igualdade entre banco e memória ou aparência.

Antes de considerar a refatoração encerrada, validar: comum ↔ parcelada, comum ↔ fixa e fixa ↔ parcelada; desativar parcelamento e reabrir o app conferindo os três metadados; editar parcela intermediária com total menor/igual/maior; encerrar fixa e navegar para trás/frente sem reaparecer; editar histórico anterior a encerramento; abrir após meses sem uso; salvar enquanto muda de mês; falha no meio da recriação; renomear categoria para nome existente; excluir categoria usada em outro mês; comparar saldo/home/analytics e temas com a versão anterior. Usar dados de teste, sem apagar dados pessoais.

## Plano sugerido em blocos pequenos

1. **Serviços — integridade primeiro.** Arquivos: `src/features/transactions/services/{transaction-management-service,transaction-service,installment-service,fixed-transaction-service}.ts`, `src/hooks/use-transactions.ts`. Validar totais antes de excluir, tratar falhas e coordenar mutações; preparar proposta de atomicidade para aprovação se envolver o banco. Não mudar schema, IDs ou migrações sem autorização. Verificar conversões e histórico em cada entrega.
2. **Modal — resultado assíncrono.** Arquivos: `src/components/{transaction-modal,transaction-form,transaction-options,category-modals}.tsx`, `src/hooks/use-categories.ts`. Fazer estado acompanhar sucesso/recusa da operação, preservar entrada em falha e tipar estilos com precisão. Qualquer mudança no comportamento do formulário deve ser aprovada antes de implementar. Depois, remover imports/comentários óbvios sem uso nos arquivos editados.
3. **Home — coordenação.** Arquivos: `src/app/index.tsx`, `src/components/{home-tabs,month-navigation,financial-summary,transactions-content,transactions-filter}.tsx`. Consolidar tipos repetidos e conferir integração com hooks; manter fluxos de backup e API existentes. Comparar navegação, filtros, estado vazio e visual. Tratar a mudança preexistente de cores em decisão separada.
4. **Cálculos — equivalência.** Arquivos: `src/utils/{financial-summary,analytics-summary,balance,fixed,month}.ts`, `src/components/analytics-view.tsx`. Verificar cenários de centavos, pendências e agrupamento com nomes especiais; preservar fórmula e adaptador. Definir a política de lacunas de fixas antes de alterar geração.
5. **Limpeza e ferramenta, em entrega separada.** Selecionar candidatos da tabela após autorização explícita de exclusão. Resolver configuração/dependências do lint com aprovação própria, pois a execução atual tenta alterar o projeto. Repetir TypeScript e lint após cada bloco implementado; não iniciar Expo sem solicitação.
