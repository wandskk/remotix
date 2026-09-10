# Protocolo de SMS

## Catálogo de comandos

O frontend nunca decide o texto do SMS para operações críticas. Cada
`Device` tem sua própria lista de `DeviceCommand` — pares *label visível ao
cliente* + *texto exato de SMS que aquele hardware espera* — cadastrados
pelo admin (docs/product-overview.md#hardware-e-comandos). Modelos de
hardware diferentes podem esperar textos diferentes para a mesma ação
física; por isso não existe uma lista fixa por tipo de dispositivo, cada
instalação define os próprios comandos.

O cliente só vê o `label`; o `sms` cadastrado é resolvido no backend na
hora de criar o `Command` (nunca enviado pelo frontend). Um `DeviceCommand`
desativado (`active: false`) some do painel do cliente mas continua
disponível no histórico/admin.

## Correlação comando ↔ resposta

Para dispositivos simples, embutir um ID/nonce na própria mensagem:

```
Comando:  PORTAO_ABRIR#A81F92
Resposta: PORTAO_OK#A81F92
```

O backend tenta relacionar `gateway + device + command`. Nem toda resposta
será relacionável automaticamente — nesse caso ela fica registrada como
`SmsMessage` inbound sem `command_id`.

## Segurança do canal

SMS **não é um canal criptograficamente seguro** — não enviar informação
sensível desnecessária. Para comandos críticos, usar sempre o
`COMMAND_ID`/nonce para dificultar spoofing.

## Três estados diferentes de "enviado"

1. SMS aceito pelo Android (`SmsManager` retornou sucesso)
2. SMS entregue pela rede da operadora
3. Equipamento executou o comando

O sistema **nunca** mostra "Portão aberto" só porque (1) aconteceu. Sem
confirmação do equipamento, o painel mostra apenas "SMS enviado". Só (3) —
via resposta SMS processada pelo `SmsReceiver` — leva o `Command` a
`CONFIRMED`.
