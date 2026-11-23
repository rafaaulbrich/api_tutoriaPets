# Avaliação N3 — Tutoria de pets

API REST para cadastrar tutores e pets, consultar pets por tutor e porte e transferir a tutela com JWT. Projeto integrado de Server-Side e Banco de Dados, feito com Node.js, Express, Sequelize e MySQL/MariaDB.

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `servidor.js` | Inicialização do Express e tratamento de erros |
| `config/db.js` | Conexão do Sequelize com o banco pelo driver `mysql2` |
| `models/` | Mapeamento e relacionamentos das três tabelas |
| `controllers/` | Validação, CRUD, login e consultas de Banco de Dados |
| `routes/` | Definição das rotas HTTP |
| `banco.sql` | Esquema, categorias de altura, views, triggers e procedures |
| `.env.example` | Modelo da configuração local |

## Configuração e execução

### 1. Instalar e importar o banco

Use Node.js 22 ou superior e um servidor MySQL ou MariaDB acessível.

```bash
npm ci
mariadb -u root -p --default-character-set=utf8mb4 < banco.sql
```

Se o cliente disponível no terminal se chamar `mysql`, substitua `mariadb` por `mysql`. Se já estiver no prompt do cliente, execute `SOURCE` com o caminho do arquivo no sistema em que o cliente está rodando. Por exemplo, no cliente do Windows, copie antes o arquivo pelo WSL com `cp banco.sql /mnt/c/Users/Public/avaliacao-n3.sql` e use `SOURCE C:/Users/Public/avaliacao-n3.sql`.

No cliente SQL, confira a importação:

```sql
USE avaliacao_n3;
SHOW TABLES;
SHOW TRIGGERS;
SHOW PROCEDURE STATUS WHERE Db = DATABASE();
SELECT * FROM altura_pet;
```

### 2. Criar o usuário da API

Execute os comandos abaixo com uma conta administrativa e escolha uma senha. Se o Node rodar no WSL e o MariaDB no Windows, substitua `127.0.0.1` nos dois comandos pelo IP do **cliente WSL** visto pelo banco. Esse é o endereço depois de `@` caso o MariaDB retorne `Access denied`.

```sql
CREATE USER 'pet_api'@'127.0.0.1' IDENTIFIED BY 'senha_do_banco';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE
ON avaliacao_n3.* TO 'pet_api'@'127.0.0.1';
```

### 3. Configurar o ambiente e iniciar

```bash
cp -n .env.example .env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
nano .env
```

```dotenv
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=pet_api
DB_PASSWORD="senha_do_banco"
DB_NAME=avaliacao_n3
LOGIN_USUARIO=admin
LOGIN_SENHA="senha_do_login"
JWT_SEGREDO=cole_o_valor_gerado
```

No WSL em modo NAT, com o banco no Windows, use em `DB_HOST` o endereço do **servidor Windows** acessível pelo WSL. Você pode obtê-lo com `ip route show default | awk '{print $3; exit}'`. A senha do login da API é independente da senha do banco. O segredo do JWT deve ter pelo menos 32 bytes. O `.env` fica fora do Git.

```bash
npm start
```

Mantenha o servidor rodando e use outro terminal para os exemplos abaixo. A base padrão da API é `http://localhost:3000`. Para verificar a conexão, acesse `/alturas`. Uma requisição a `/` retorna `404`, pois as rotas começam em caminhos como `/tutores`, `/pets` e `/relatorios`.

## Exemplos de uso com curl

### Cadastrar tutores

Use os CPFs fictícios abaixo em um banco de teste. Se já houver cadastro com algum desses CPFs, escolha outro e ajuste os comandos seguintes. Um cadastro bem-sucedido retorna `201 Created`.

```bash
BASE=http://localhost:3000
curl -i "$BASE/alturas"

curl -i -X POST "$BASE/tutores" \
  -H 'Content-Type: application/json' \
  -d '{"cpf":"11111111111","nome":"Ana Costa","email":"ana@example.com"}'

curl -i -X POST "$BASE/tutores" \
  -H 'Content-Type: application/json' \
  -d '{"cpf":"22222222222","nome":"Bruno Lima","email":"bruno@example.com"}'
```

### Cadastrar pets

Cadastre três pets para Ana. Bruno começa sem pets, o que permite conferir o relatório de tutores sem pets e a transferência. O servidor gera `codigo_pet`. Anote os valores retornados e use-os nas etapas seguintes.

```bash
curl -i -X POST "$BASE/pets" \
  -H 'Content-Type: application/json' \
  -d '{"nome_pet":"Luna","genero_pet":"fêmea","altura_cm":12,"cpf_tutor":"11111111111"}'

curl -i -X POST "$BASE/pets" \
  -H 'Content-Type: application/json' \
  -d '{"nome_pet":"Mel","genero_pet":"fêmea","altura_cm":24.5,"cpf_tutor":"11111111111"}'

curl -i -X POST "$BASE/pets" \
  -H 'Content-Type: application/json' \
  -d '{"nome_pet":"Toby","genero_pet":"macho","altura_cm":45,"cpf_tutor":"11111111111"}'
```

Os triggers associam o porte na criação e na atualização. Envie a altura em centímetros, com até duas casas decimais.

| `id_altura` | Classificação | Regra |
| --- | --- | --- |
| 1 | pequeno | Até 13 cm |
| 2 | média | Acima de 14 e abaixo de 40 cm |
| 3 | alto | Acima de 13 até 14 cm, inclusive, ou a partir de 40 cm |

### Listar, buscar e filtrar

Substitua `CODIGO_DA_LUNA` pelo `codigo_pet` real retornado no cadastro. Com os dados acima, a última consulta deve retornar Mel.

```bash
LUNA=CODIGO_DA_LUNA
curl -i "$BASE/tutores"
curl -i "$BASE/tutores/11111111111"
curl -i "$BASE/pets"
curl -i "$BASE/pets/$LUNA"
curl -i "$BASE/tutores/11111111111/pets"
curl -i "$BASE/pets?cpf=11111111111"
curl -i "$BASE/pets?id_altura=2"/
curl -i "$BASE/pets?cpf=11111111111&id_altura=2"
```

### Consultar os relatórios

Rode antes da transferência para ver Bruno em `tutores-sem-pets`. Na procedure de perfil, `minimo=1` inclui todo grupo que tem pets. Com `minimo=2`, estes dados de exemplo retornam `[]` porque Ana tem um pet por porte.

```bash
curl -i "$BASE/relatorios/medidas-por-tutor"
curl -i "$BASE/relatorios/tutores-sem-pets"
curl -i "$BASE/relatorios/pets-acima-da-media"
curl -i "$BASE/relatorios/fichas"
curl -i "$BASE/relatorios/ocupacao-portes"
curl -i "$BASE/relatorios/perfil-por-porte?minimo=1"
curl -i "$BASE/relatorios/perfil-por-porte?minimo=2"
```

### Atualizar tutor e pet

Envie o corpo inteiro da atualização. No tutor, `cpf` é opcional e permite mudar a chave quando enviado. No pet, o exemplo muda Luna de 12 para 14 cm. A resposta deve trazer `id_altura: 3`.

```bash
curl -i -X PUT "$BASE/tutores/11111111111" \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Ana Costa","email":"ana.atualizado@example.com"}'

curl -i -X PUT "$BASE/pets/$LUNA" \
  -H 'Content-Type: application/json' \
  -d '{"nome_pet":"Luna","genero_pet":"fêmea","altura_cm":14,"cpf_tutor":"11111111111"}'
```

### Fazer login e transferir a tutela

Neste exemplo, Luna já está cadastrada e será transferida para Bruno, CPF `22222222222`. Mantenha o servidor rodando e use outro terminal.

**1. Descubra o código de Luna.** Na resposta, procure `"nome_pet":"Luna"` e anote o `codigo_pet` desse mesmo registro.

```bash
curl -sS http://localhost:3000/tutores/11111111111/pets
```

**2. Faça login.** No comando, troque `admin` e `senha_do_login` pelos valores de `LOGIN_USUARIO` e `LOGIN_SENHA` do seu `.env`.

```bash
curl -i -X POST "$BASE/login" \
  -H 'Content-Type: application/json' \
  -d '{"usuario":"admin","senha":"senha_do_login"}'
```

Se aparecer `HTTP 200`, copie o valor de `token` que veio no JSON, sem as aspas. O token vale uma hora. Se aparecer `401` aqui, confira as credenciais de login e reinicie o servidor caso tenha editado o `.env`.

**3. Transfira a tutela.** Troque `7` pelo código que você anotou. Execute as linhas abaixo no mesmo terminal.

```bash
LUNA=7
read -rsp 'Cole o token e pressione Enter: ' TOKEN
printf '\n'
curl -i -X PATCH "$BASE/pets/$LUNA/tutor" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"cpf_tutor":"22222222222"}'
unset TOKEN
```

O texto colado no prompt do token fica invisível. Pressione **Enter** depois de colar. A transferência retorna `200`. Um `401` nessa etapa indica que o token está ausente, inválido ou expirou. Um `404` pode indicar que o código do pet ou o CPF de destino não existe.

**4. Confira a tutela.** Luna deve aparecer na lista de Bruno.

```bash
curl -i http://localhost:3000/tutores/22222222222/pets
```

### Excluir os dados de exemplo

Preencha `MEL` e `TOBY` com os códigos do seu teste. Os deletes bem-sucedidos retornam `204`, com corpo vazio. Excluir um tutor com pets vinculados retorna `409`.

```bash
MEL=CODIGO_DA_MEL
TOBY=CODIGO_DO_TOBY
curl -i -X DELETE "$BASE/pets/$LUNA"
curl -i -X DELETE "$BASE/pets/$MEL"
curl -i -X DELETE "$BASE/pets/$TOBY"
curl -i -X DELETE "$BASE/tutores/11111111111"
curl -i -X DELETE "$BASE/tutores/22222222222"
```

## Rotas

| Método | Caminho | Operação |
| --- | --- | --- |
| GET, POST | `/tutores` | Listar ou cadastrar tutores |
| GET, PUT, DELETE | `/tutores/:cpf` | Buscar, atualizar ou excluir um tutor |
| GET | `/tutores/:cpf/pets` | Listar pets do tutor |
| GET, POST | `/pets` | Listar ou cadastrar pets. Aceita filtros `cpf` e `id_altura` no GET |
| GET, PUT, DELETE | `/pets/:codigo` | Buscar, atualizar ou excluir um pet |
| GET | `/alturas` | Listar os portes de referência |
| POST | `/login` | Emitir JWT |
| PATCH | `/pets/:codigo/tutor` | Transferir tutela com JWT |
| GET | `/relatorios/medidas-por-tutor` | Contar pets por tutor e porte |
| GET | `/relatorios/tutores-sem-pets` | Listar tutores sem vínculos |
| GET | `/relatorios/pets-acima-da-media` | Listar pets acima da média de altura do próprio tutor |
| GET | `/relatorios/fichas` | Consultar fichas com tutor, altura e porte |
| GET | `/relatorios/ocupacao-portes` | Contar pets e tutores por porte |
| GET | `/relatorios/perfil-por-porte?minimo=1` | Consultar grupos de tutor e porte com pelo menos a quantidade informada |

## Erros comuns

| Resultado | O que conferir |
| --- | --- |
| `ECONNREFUSED` ao iniciar | Serviço MariaDB/MySQL, `DB_HOST` e `DB_PORT` |
| `Access denied` ao iniciar | Senha do banco no `.env` e conta `pet_api` cadastrada no MariaDB para o IP do cliente exibido no erro |
| `400` | Corpo JSON, CPF com 11 dígitos em texto e código do pet numérico |
| `401` | Credenciais do login ou token no formato `Authorization: Bearer <token>` |
| `404` | Método, caminho, CPF ou código informado. `GET /` retorna `404` |
| `409` | CPF já cadastrado ou tutor com pets vinculados |
| `200` com `[]` | Nenhum registro atende ao filtro ou ao relatório |
