## Etapa 1 — Segurança e validação de dados

Nesta etapa, foram implementadas melhorias na validação e no tratamento dos dados recebidos pela API, utilizando **Zod** para centralizar as regras de validação e garantir que informações inconsistentes não sejam persistidas no MongoDB.

O objetivo é aplicar as mesmas regras independentemente da origem da requisição, protegendo as operações de cadastro e edição contra entradas inválidas, inclusive quando enviadas diretamente por ferramentas externas, como Postman ou outros clientes HTTP.

### 1. Dependência utilizada

Foi adicionada a biblioteca Zod ao projeto:

```bash
npm install zod
```

O Zod permite definir schemas de validação com suporte a TypeScript, facilitando a verificação dos tipos, formatos e limites dos dados recebidos.

### 2. Schema de validação

As regras foram centralizadas no arquivo:

`src/validators/client.ts`

O schema `clientSchema` define as validações aplicadas aos quatro campos do cadastro:

| Campo | Regras aplicadas |
|---|---|
| `name` | String obrigatória, entre 2 e 120 caracteres. Aceita letras, acentos, espaços, pontos, apóstrofos e hífens. |
| `phone` | String obrigatória, entre 10 e 20 caracteres. Aceita números, espaços, parênteses, sinais de adição e hífens. |
| `email` | String obrigatória, formato de e-mail válido e máximo de 254 caracteres. Convertido para letras minúsculas. |
| `address` | String obrigatória, entre 5 e 250 caracteres. |

A utilização de `.trim()` remove espaços excedentes no início e no final dos valores antes da validação.

A normalização do e-mail é realizada por `.transform()`, garantindo que o valor validado seja convertido para letras minúsculas antes de chegar ao banco de dados.

**Observação:** a validação do telefone verifica o formato e os caracteres permitidos, mas não confirma a existência ou titularidade do número.

### 3. Validação na API

As validações foram aplicadas diretamente nos Route Handlers do Next.js, garantindo que os dados sejam verificados no servidor antes de qualquer operação de persistência.

#### 3.1. Listagem de clientes

**Endpoint:** `GET /api/clients`

**Arquivo:** `src/app/api/clients/route.ts`

Responsável por consultar os registros armazenados no MongoDB.

- Estabelece conexão com o banco por meio de `connectMongoDB()`.
- Consulta os registros utilizando `Client.find()`.
- Ordena os resultados pela data de criação, do mais recente para o mais antigo.
- Retorna os dados em formato JSON.

**Resposta de sucesso — HTTP 200:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "672a12345678901234567890",
      "name": "João da Silva",
      "phone": "13999999999",
      "email": "joao@email.com",
      "address": "Santos - SP"
    }
  ]
}
```

#### 3.2. Cadastro de clientes

**Endpoint:** `POST /api/clients`

**Arquivo:** `src/app/api/clients/route.ts`

Responsável por receber e cadastrar novos clientes.

Fluxo de execução:

1. Estabelece conexão com o MongoDB.
2. Obtém os dados enviados no corpo da requisição (`request.json()`).
3. Executa `clientSchema.safeParse(body)` para validar e normalizar os dados.
4. Caso a validação falhe, interrompe a operação e retorna os erros identificados.
5. Caso seja aprovado, utiliza `Client.create(validation.data)` para persistir o registro.
6. Retorna os dados do cliente cadastrado.

**Exemplo de requisição:**

```http
POST /api/clients
Content-Type: application/json
```

```json
{
  "name": "João da Silva",
  "phone": "13999999999",
  "email": "JOAO@EMAIL.COM",
  "address": "Santos - SP"
}
```

**Resposta de sucesso — HTTP 201:**

```json
{
  "success": true,
  "message": "Cliente cadastrado com sucesso.",
  "data": {
    "_id": "672a12345678901234567890",
    "name": "João da Silva",
    "phone": "13999999999",
    "email": "joao@email.com",
    "address": "Santos - SP"
  }
}
```

#### 3.3. Edição de clientes

**Endpoint:** `PUT /api/clients/[id]`

**Arquivo:** `src/app/api/clients/[id]/route.ts`

Responsável por atualizar os dados de um cliente existente.

Fluxo de execução:

1. Estabelece conexão com o MongoDB.
2. Obtém o identificador do cliente por meio dos parâmetros da rota.
3. Verifica o formato do identificador utilizando `mongoose.isValidObjectId(id)`.
4. Obtém os dados enviados no corpo da requisição.
5. Executa `clientSchema.safeParse(body)` para validar e normalizar os campos.
6. Caso a validação falhe, interrompe a operação e retorna os erros identificados.
7. Caso seja aprovado, executa `Client.findByIdAndUpdate()`, utilizando os dados validados.
8. Verifica se o cliente existe e retorna o registro atualizado.

A operação utiliza as opções:

- `new: true`: retorna o documento após a atualização.
- `runValidators: true`: executa as validações definidas no schema do Mongoose durante a atualização.

**Exemplo de requisição:**

```http
PUT /api/clients/672a12345678901234567890
Content-Type: application/json
```

```json
{
  "name": "João da Silva Atualizado",
  "phone": "13988887777",
  "email": "joao@empresa.com",
  "address": "Praia Grande - SP"
}
```

**Resposta de sucesso — HTTP 200:**

```json
{
  "success": true,
  "message": "Cliente atualizado com sucesso.",
  "data": {
    "_id": "672a12345678901234567890",
    "name": "João da Silva Atualizado",
    "phone": "13988887777",
    "email": "joao@empresa.com",
    "address": "Praia Grande - SP"
  }
}
```

### 4. Tratamento de respostas e erros

As rotas de cadastro e edição utilizam o método `safeParse()` para verificar os dados recebidos.

Quando ocorre uma falha de validação, a API retorna HTTP `400 Bad Request`, juntamente com uma mensagem geral e os erros separados por campo, utilizando `validation.error.flatten().fieldErrors`.

**Exemplo de resposta — HTTP 400:**

```json
{
  "success": false,
  "message": "Dados inválidos. Verifique os campos informados.",
  "errors": {
    "name": [
      "O nome deve conter apenas letras e caracteres válidos."
    ],
    "email": [
      "Informe um e-mail válido."
    ]
  }
}
```

Outros códigos de resposta utilizados:

| Código HTTP | Situação |
|---|---|
| `200` | Consulta ou atualização realizada com sucesso. |
| `201` | Cliente cadastrado com sucesso. |
| `400` | Dados inválidos ou identificador em formato incorreto. |
| `404` | Cliente não encontrado durante a edição. |
| `500` | Erro interno durante o processamento da requisição. |

### 5. Tratamento dos erros no frontend

O componente `ClientForm.tsx` recebe as falhas retornadas pela API e apresenta as mensagens ao usuário.

A comunicação ocorre por meio do fluxo:

1. O formulário envia os dados para a função `handleSave`, em `src/app/page.tsx`.
2. A função realiza a requisição HTTP correspondente (POST ou PUT).
3. A resposta JSON é analisada.
4. Quando a API retorna erros de validação, as mensagens são organizadas e encaminhadas ao formulário.
5. O componente apresenta os campos que precisam de correção, sem fechar o modal.

Dessa maneira, o tratamento visual dos erros é separado das regras de validação, que permanecem centralizadas no backend.

### 6. Como testar

Os endpoints podem ser testados utilizando Postman, Insomnia ou qualquer cliente HTTP.

| Método | Endpoint | Finalidade |
|---|---|---|
| GET | `/api/clients` | Consultar todos os clientes. |
| POST | `/api/clients` | Cadastrar um novo cliente. |
| PUT | `/api/clients/{id}` | Atualizar um cliente existente. |

**Casos de teste recomendados:**

| Entrada | Resultado esperado |
|---|---|
| Nome com números (`123456`) | HTTP 400 |
| Nome com caracteres especiais não permitidos (`@#$%`) | HTTP 400 |
| Nome válido com acentos (`João da Silva`) | Aceito |
| Telefone contendo letras (`abcdefghij`) | HTTP 400 |
| E-mail inválido (`teste@email`) | HTTP 400 |
| Endereço vazio | HTTP 400 |
| Campos contendo apenas espaços | HTTP 400 |
| Identificador inválido na edição | HTTP 400 |
| Identificador válido, mas inexistente | HTTP 404 |
| Dados válidos no cadastro | HTTP 201 |
| Dados válidos na edição | HTTP 200 |

Para verificar a proteção da persistência, recomenda-se enviar uma requisição PUT com dados inválidos e, em seguida, consultar novamente o cliente. Os valores originais devem permanecer inalterados.

### 7. Resultado da implementação

Com as alterações, as operações de cadastro e edição passam a compartilhar uma única fonte de regras de validação, reduzindo duplicações e inconsistências entre os endpoints.

A validação é executada no servidor, independentemente das verificações realizadas pelo frontend. Dessa forma, requisições externas também estão sujeitas às mesmas regras antes de qualquer alteração no MongoDB.

A implementação melhora a integridade dos dados, o tratamento de erros e a previsibilidade do comportamento da API, mantendo a arquitetura integrada do Next.js.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
