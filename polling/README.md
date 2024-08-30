# Polling de mensagens

Para executar o programa é necessário possuir o runtime do Node.js instalado na máquina

Após o node estar instalado e necessário instalar as dependecias do servidor de mensagens:

```sh
.../polling $ npm install
```

Com todas dependecias instaladas primeiro deve-se executar o servidor com:

```sh
.../polling $ node ./src/server/server.js
```

Após o servidor estar rodando na porta 3000, multiplos clientes podem ser executados com:

```sh
.../polling $ node src/client/client.js
```