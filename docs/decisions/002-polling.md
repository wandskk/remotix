# ADR 002 — Polling em vez de WebSocket

**Decisão**: o Android Gateway consulta a API (`Android → API →
PostgreSQL`) em intervalos controlados (padrão 5s, configurável) em vez de
manter uma conexão persistente.

**Motivo**: compatibilidade com Vercel Free (sem processo persistente),
simplicidade, baixo custo, facilidade de manutenção.

**Futuro**: se a escala justificar, o polling pode ser complementado ou
substituído por realtime/WebSocket externo — não antecipar essa mudança
antes de haver necessidade real.
