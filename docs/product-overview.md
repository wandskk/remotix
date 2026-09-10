# Visão de produto — como o Remotix funciona

Este documento descreve o funcionamento do sistema do ponto de vista do
negócio (o que o admin faz, o que o cliente vê, como o comando chega no
equipamento), complementando a arquitetura técnica em
[architecture.md](architecture.md). Escrito a partir da descrição do
funcionamento esperado dada pelo dono do produto em 2026-09-10.

## Visão geral

```
Admin cadastra cliente
  → Admin cadastra o hardware do cliente (telefone do equipamento)
  → Admin cadastra os comandos específicos daquele hardware
  → Cliente recebe um link, faz login uma única vez
  → Cliente vê na tela só os botões dos comandos que o admin criou pra ele
  → Cliente clica num botão
  → Sistema web cria o comando e o coloca na fila
  → App Android (gateway) consulta a fila, pega o comando, envia o SMS
  → Hardware do equipamento recebe o SMS, reconhece o texto e executa
     a ação (abre o portão, liga a luz, etc.)
```

## Clientes

Cada cliente cadastrado no admin representa um contratante do sistema —
uma pessoa ou empresa que tem um ou mais equipamentos controlados por SMS.
O admin pode cadastrar múltiplos clientes (escala inicial esperada: ~10
clientes). Cada cliente só enxerga e opera os próprios equipamentos e
comandos — nunca os de outro cliente.

## Hardware e comandos

Cada cliente tem um hardware físico já pré-configurado, instalado junto ao
equipamento controlado (portão, luz, bomba, etc.). Esse hardware:

- tem um número de telefone próprio (o número que recebe o SMS);
- já vem programado de fábrica/instalação para reconhecer textos
  específicos e executar a ação correspondente quando o SMS bate com um
  desses textos (ex.: o texto `PORTAO_ABRIR` faz o hardware abrir o
  portão).

O admin cadastra, para cada cliente:

1. **o número de telefone do hardware** (equivalente ao `Device` do
   sistema);
2. **os comandos específicos daquele hardware** — cada comando é um par
   *label visível ao cliente* + *texto exato de SMS que aquele modelo de
   hardware espera*. Modelos de hardware diferentes podem esperar textos
   diferentes para a mesma ação (um portão pode esperar `PORTAO_ABRIR`,
   outro pode esperar `ABRIR_PORTAO_1`) — por isso o texto do comando é
   configurado pelo admin por cliente/hardware, não fixo no código.

O cliente nunca escolhe ou vê o texto do SMS — só o label do comando
(“Abrir portão”, “Ligar luz da entrada” etc.). O texto exato que sai como
SMS é sempre resolvido pelo backend a partir do que o admin cadastrou.

## Onboarding e login do cliente

O cliente não define a própria senha antecipadamente nem recebe
credenciais por fora do sistema: o admin cria o acesso do cliente e o
sistema gera um **link de configuração de login**, enviado ao cliente uma
única vez. Ao acessar esse link, o cliente define sua própria senha (ou
confirma o acesso) e a partir daí pode entrar normalmente pela tela de
login.

Depois do primeiro login, a sessão do cliente deve durar — ele não deve
precisar fazer login toda vez que abrir o sistema. A expectativa é de uma
sessão de longa duração (dias/semanas), renovada enquanto ele estiver
usando o sistema.

## Painel do cliente

O cliente, ao entrar, vê **apenas os botões dos comandos que o admin
cadastrou para o hardware dele** — nada além disso. Se o admin cadastrou 3
comandos para aquele cliente, aparecem exatamente 3 botões. Não existe uma
lista fixa de comandos por “tipo de equipamento”: os comandos são o que o
admin definiu, ponto a ponto, para aquele cliente/hardware.

Ao clicar num botão, o cliente:

1. dispara a criação de um comando no sistema;
2. vê o status mudar (pendente → enviado → confirmado/falhou) — sem
   nunca ver “executado com sucesso” só porque o SMS foi enviado, apenas
   quando (e se) o hardware responder confirmando.

## Do clique ao SMS

```
Cliente clica no botão "Abrir portão"
  → Backend cria um Command (fila) com o texto de SMS que o admin
    configurou para esse comando/cliente
  → App Android (gateway), que fica consultando o servidor periodicamente
    (polling — não existe push/notificação do servidor pro Android),
    pega esse comando na próxima consulta
  → App Android envia o SMS pro número do hardware daquele cliente
  → Hardware recebe o SMS, reconhece o texto pré-configurado e executa
    a ação física (abre o portão, liga a luz, etc.)
```

## Escala esperada

Inicialmente o sistema deve suportar ~10 clientes, cada um com seu próprio
hardware e seus próprios comandos. A arquitetura (fila em PostgreSQL,
polling do Android, sem infraestrutura dedicada) já foi desenhada para
essa escala sem necessidade de mudanças — ver
[architecture.md](architecture.md#restrição-de-infraestrutura).

## Onde isso diverge do que já está implementado hoje

Duas partes desta descrição **ainda não correspondem exatamente** ao que
está em produção — o sistema hoje resolve essas duas coisas de um jeito
mais simples/rígido, e precisa de ajuste para bater com o que está
descrito acima:

### 1. Catálogo de comandos fixo por tipo de dispositivo

Hoje (`lib/commands/catalog.ts`) os comandos disponíveis para um
dispositivo são determinados pelo **tipo** dele (`GATE`, `LIGHT`, `PUMP`,
`ALARM`, `OTHER`), com uma lista fixa de 2 ações e textos de SMS
*hardcoded* no código — não configurável pelo admin. Isso não permite o
que foi descrito: o admin cadastrando comandos específicos (label + texto
de SMS) por cliente/hardware, podendo ter qualquer quantidade de comandos
(não só 2), com textos diferentes por instalação.

Para bater com a descrição, seria necessário: uma entidade nova
`DeviceCommand` (ou similar) — label + ação/texto de SMS — cadastrada pelo
admin por `Device`, substituindo (ou complementando) o catálogo fixo
atual. O painel do cliente passaria a listar os `DeviceCommand`s do
dispositivo em vez de resolver por `DeviceType`.

### 2. Login do cliente via link único, sem convite hoje

Hoje o admin cria o usuário `CLIENT` já digitando uma senha provisória
diretamente no formulário (`components/admin/client-user-form.tsx`) — o
cliente recebe essa senha por fora do sistema (não há geração de link,
nem fluxo de "definir sua própria senha no primeiro acesso"). A sessão já
é de longa duração por padrão (JWT do NextAuth, expira em 30 dias por
padrão) — isso já bate com "manter logado depois do primeiro acesso", mas
falta o fluxo do link de configuração inicial.

Para bater com a descrição, seria necessário: gerar um token de convite
com validade limitada ao criar o usuário CLIENT, uma página pública
`/convite/[token]` onde o cliente define a própria senha, e enviar esse
link por algum canal (e-mail, ou simplesmente copiável pelo admin para
enviar manualmente, já que o sistema não tem envio de e-mail hoje).

Essas duas mudanças não foram implementadas ainda — só documentadas aqui.
Avise quando quiser que eu implemente uma delas (ou as duas).
