
# Fractal Security — Desafio Técnico: Gestão de Clientes

Aplicação Full Stack desenvolvida para o processo seletivo da **Fractal Security** (Desenvolvedor Full Stack Trainee). O sistema implementa o ciclo completo de cadastro, busca, edição, paginação, exportação e importação resiliente de clientes via planilha CSV com interface inspirada no design system da Fractal.

---

## Tecnologias Utilizadas

- **Framework:** Next.js (App Router, Turbopack, Serverless Route Handlers)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS (tema dark, paleta Fractal Security)
- **Validação de Dados:** Zod
- **Banco de Dados:** MongoDB Atlas com Mongoose (padrão Singleton com cache global)
- **Parser de Dados:** PapaParse (RFC 4180 e compatibilidade UTF-8 / BOM)
- **Deploy:** Vercel

---

## Como Executar o Projeto Localmente

### 1. Pré-requisitos
- Node.js 20.x ou superior
- Instância ou cluster no MongoDB Atlas (ou MongoDB local)

### 2. Instalação e Configuração

Clone o repositório e instale as dependências:

```bash
git clone [https://github.com/AtilioAlmeidaCosta/desafio-fractal.git](https://github.com/AtilioAlmeidaCosta/desafio-fractal.git)
cd desafio-fractal
npm install

```

Crie um arquivo `.env.local` na raiz do projeto com sua string de conexão:

```env
MONGODB_URI=mongodb+srv://<usuario>:<senha>@cluster0.xxxx.mongodb.net/desafio_fractal?retryWrites=true&w=majority

```

Inicie o servidor de desenvolvimento:

```bash
npm run dev

```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## Etapa 1 — Segurança e Validação de Dados (Cadastro e Edição)

Nesta etapa, foram implementadas as regras de validação e o tratamento dos dados recebidos pela API, utilizando **Zod** para centralizar as regras de negócio e garantir que informações inconsistentes não sejam persistidas no MongoDB.

### 1. Dependência Utilizada

```bash
npm install zod

```

### 2. Schema de Validação

As regras estão centralizadas em `src/validators/client.ts`:

| Campo | Regras aplicadas |
| --- | --- |
| `name` | String obrigatória, entre 2 e 120 caracteres. Aceita letras, acentos unicode, espaços, pontos, apóstrofos e hífens. |
| `phone` | String obrigatória, entre 10 e 20 caracteres. Aceita números, espaços, parênteses, sinal de adição (`+`) e hífens. |
| `email` | String obrigatória, formato de e-mail válido, máx. 254 caracteres e transformado para minúsculas (`toLowerCase`). |
| `address` | String obrigatória, entre 5 e 250 caracteres. |

### 3. Validação na API

#### 3.1. Listagem de clientes

* **Endpoint:** `GET /api/clients`
* **Arquivo:** `src/app/api/clients/route.ts`
* Retorna todos os clientes ordenados do mais recente para o mais antigo.

#### 3.2. Cadastro manual de clientes

* **Endpoint:** `POST /api/clients`
* **Arquivo:** `src/app/api/clients/route.ts`
* Valida o payload com `clientSchema.safeParse()`. Retorna `201 Created` ou `400 Bad Request`.

#### 3.3. Edição de clientes

* **Endpoint:** `PUT /api/clients/[id]`
* **Arquivo:** `src/app/api/clients/[id]/route.ts`
* Valida o `ObjectId` com `mongoose.isValidObjectId(id)`, revalida o corpo com Zod e atualiza via `Client.findByIdAndUpdate()`.

---

## Etapa 2 — Importação Inteligente de CSV, Exportação e Paginação

A segunda etapa aborda a importação em lote a partir de planilhas comerciais (`.csv`), tratando inconsistências, divergências de encoding, detecção de duplicidades e fornecendo uma área interativa de revisão para o operador.

### 1. Dependências Adicionadas

```bash
npm install papaparse
npm install -D @types/papaparse

```

### 2. Arquitetura da Solução

```
src/
├── app/
│   ├── api/
│   │   └── clients/
│   │       ├── export/route.ts          # Download da base completa em CSV UTF-8 BOM
│   │       ├── import/
│   │       │   ├── route.ts             # Análise e triagem (dry-run com consulta Mongo)
│   │       │   └── confirm/route.ts     # Inserção atômica em lote (insertMany)
├── components/
│   └── clients/
│       ├── ClientList.tsx               # Grid com paginação manual e automática
│       └── import/
│           ├── ImportModal.tsx          # Orquestrador (upload, preview, report)
│           ├── ImportPreview.tsx        # Revisão com abas, edição inline e exportação de erros
│           └── ImportReport.tsx         # Feedback de confirmação
├── lib/
│   ├── mongodb.ts                       # Conexão singleton com bufferCommands: false
│   └── csv/
│       ├── normalizer.ts                # Correção de mojibake e normalização de headers
│       └── parser.ts                    # PapaParse configurado com regras RFC 4180
└── types/
    └── import.ts                        # Contratos de triagem (Valid, Pending, Duplicate)

```

---

### 3. Tratamento de Codificação e Mojibake

Arquivos exportados por planilhas como o Excel frequentemente sofrem de *mojibake* (ex.: bytes UTF-8 lidos indevidamente como ISO-8859-1 / Windows-1252, exibindo `EndereÃ§o` ou `AraÃºjo`):

* **Leitura do Stream:** O payload é decodificado explicitamente via `new TextDecoder("utf-8")`.
* **Normalização de Cabeçalhos:** A função `normalizeHeaderKey` sanitiza variações de acentuação e caixa, mapeando inclusive variações corrompidas de cabeçalho (`EndereÃ§o` ou `Endereço`) diretamente para a propriedade `address`.
* **Sanitização de Células:** A função `sanitizeEncoding` inspeciona os bytes com patterns `\u00C2` e `\u00C3`, restaurando a acentuação limpa original sem fazer substituições manuais de caracteres.
* **Campos Complexos:** Endereços com vírgulas internas protegidos por aspas duplas (RFC 4180) são interpretados pelo PapaParse sem truncamento de colunas.

---

### 4. Triagem e Classificação dos Registros

Ao enviar o arquivo, o endpoint `POST /api/clients/import` realiza a triagem em memória sem persistir dados no banco:

1. **Consulta Otimizada em Lote:** Extrai os e-mails informados e realiza uma única consulta ao MongoDB (`Client.find({ email: { $in: candidateEmails } })`), minimizando viagens de rede (I/O).
2. **Separação em 3 Categorias:**
* **Válidos (`valid`):** Registros com todos os campos preenchidos, validados pelo Zod e sem duplicação.
* **Pendentes (`pending`):** Linhas com campos obrigatórios ausentes ou em formato inválido. O objeto original é preservado e acompanhado pelo mapa de erros do Zod.
* **Duplicados (`duplicates`):** Registros cujo e-mail já existe no MongoDB (`already_registered`) ou que aparecem repetidos dentro do próprio CSV (`csv_duplicate`).


3. **Linhas Vazias:** Linhas sem nenhum dado útil são ignoradas e quantificadas em `ignoredEmptyRows`.

---

### 5. Área de Revisão Interativa e Resolução de Erros

O operador dispõe de dois caminhos complementares para lidar com dados inconsistentes:

1. **Correção Direta no Sistema:**
* Na aba **Pendentes**, o operador edita os campos com erro em tempo real diretamente na interface.
* Ao corrigir as pendências, clica em **"Validar e Incluir"**, promovendo o registro para a lista de **Válidos**.
* Possibilidade de descartar linhas indesejadas individualmente.


2. **Devolução para a Área Comercial (Download de Erros):**
* Um botão permite gerar e baixar instantaneamente uma planilha `.csv` contendo apenas os registros pendentes e duplicados.
* Uma coluna adicional (`Motivo_Erro`) discrimina com precisão o que precisa ser corrigido (ex.: `TELEFONE: O telefone contém caracteres inválidos | EMAIL: Informe um e-mail válido`).



---

### 6. Persistência em Lote e Exportação

#### 6.1. Inserção em Lote

* **Endpoint:** `POST /api/clients/import/confirm`
* **Arquivo:** `src/app/api/clients/import/confirm/route.ts`
* Revalida toda a carga com `z.array(clientSchema)` no backend para garantir integridade.
* Executa inserção de alta performance com `Client.insertMany(clients, { ordered: false })`.

#### 6.2. Exportação da Base Completa

* **Endpoint:** `GET /api/clients/export`
* **Arquivo:** `src/app/api/clients/export/route.ts`
* Consulta a coleção e gera um arquivo CSV formatado.
* Adiciona o byte de ordem de leitura **BOM UTF-8** (`\uFEFF`), garantindo abertura direta no Microsoft Excel sem perda de caracteres especiais e acentuação gráfica.

---

### 7. Paginação e Controle do Grid

Para evitar sobrecarga de renderização visual (DOM) com bases extensas:

* **Tamanho de Página Configurável:** Seletor manual para `10`, `25`, `50` ou `100` registros por tela.
* **Cálculo Automático:** Indicador do intervalo exibido (*"Mostrando X a Y de Z clientes"*) e total de páginas.
* **Filtro Integrado:** A pesquisa de clientes preserva a paginação, resetando a navegação para a página 1 a cada nova busca.

---

## Guia de Endpoints da API

| Método | Endpoint | Descrição | Status Sucesso |
| --- | --- | --- | --- |
| `GET` | `/api/clients` | Listar todos os clientes cadastrados | `200 OK` |
| `POST` | `/api/clients` | Cadastrar novo cliente manual | `201 Created` |
| `PUT` | `/api/clients/[id]` | Atualizar cliente existente por ID | `200 OK` |
| `POST` | `/api/clients/import` | Triagem e análise de arquivo CSV (Multipart/Form-Data) | `200 OK` |
| `POST` | `/api/clients/import/confirm` | Confirmação e persistência em lote dos clientes aprovados | `200 OK` |
| `GET` | `/api/clients/export` | Download da base de clientes em CSV com BOM UTF-8 | `200 OK` |

---

## Casos de Teste da Importação

Ao testar a importação com o arquivo `clientes.csv` fornecido no desafio:

| Cenário de Teste | Comportamento do Sistema |
| --- | --- |
| **Aspas e vírgulas no endereço** | Linhas com `"Rua Goiás, 999 - Boqueirão, Guarujá - SP"` mantêm o endereço íntegro em uma única coluna. |
| **Acentuação e caracteres especiais** | Nomes e endereços com acentos (`João`, `Araújo`, `Itararé`) são preservados sem corrupção. |
| **Linha com telefone textual (`telefone`)** | Enviada para a aba **Pendentes**, apontando erro no campo telefone. |
| **Nome ausente/vazio** | Enviada para a aba **Pendentes**, indicando campo obrigatório. |
| **E-mail sem domínio/arroba** | Enviada para a aba **Pendentes**, apontando e-mail inválido. |
| **E-mails duplicados na própria planilha** | A primeira ocorrência é validada; as repetições são encaminhadas para a aba **Duplicados**. |
| **E-mails já existentes no MongoDB** | Identificados na triagem e enviados para a aba **Duplicados**, impedindo sobreescrita acidental. |
| **Correção inline na interface** | Ao editar um campo na aba de pendentes e clicar em *Validar e Incluir*, o cliente migra para *Prontos para importar*. |
| **Download de erros** | Gera arquivo `.csv` saneado com a coluna explicativa `Motivo_Erro`. |

```

```
