# Protocolo de SMS

## Catálogo de comandos

O frontend nunca decide o texto do SMS para operações críticas — ele escolhe
um `type` (ex. `GATE_OPEN`) e o backend traduz via catálogo:

| type | label | sms |
|---|---|---|
| `GATE_OPEN` | Abrir portão | `PORTAO_ABRIR` |
| `GATE_CLOSE` | Fechar portão | `PORTAO_FECHAR` |
| `LIGHT_ON` | Ligar iluminação | `LUZ_ON` |
| `LIGHT_OFF` | Desligar iluminação | `LUZ_OFF` |
| `BOMBA_ON` / `BOMBA_OFF` | Bomba | `BOMBA_ON` / `BOMBA_OFF` |

O catálogo vive em `lib/commands` e permite configurar equipamentos
diferentes no futuro sem mudar o resto do sistema.

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
