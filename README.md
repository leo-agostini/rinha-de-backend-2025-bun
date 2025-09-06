# 🐓 Rinha de Backend 2025

Este projeto implementa uma solução para a **Rinha de Backend 2025**, um desafio de alta performance e resiliência para processar pagamentos de forma concorrente e consistente, respeitando as regras de consistência entre dois provedores instáveis: **Payment Processor Default** e **Payment Processor Fallback**.

---

## 🚀 Tecnologias Utilizadas
- **Node.js / Bun** → Backend de alta performance.
- **PostgreSQL** → Persistência de transações.
- **Redis** → Fila de mensagens e controle de concorrência.
- **Docker Compose** → Orquestração local.
- **Nginx** → Load balancer.
- **Workers** → Processamento concorrente de pagamentos.
---

## Arquitetura da solução:

                ┌─────────────────────────┐
                │       Cliente API        │
                └────────────┬─────────────┘
                             │
                      ┌──────▼──────┐
                      │   Nginx     │  <- Load Balancer
                      └──────┬──────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
       ┌───────▼───────┐           ┌───────▼───────┐
       │   API 1       │           │   API 2       │   <- múltiplas instâncias
       └──────┬────────┘           └──────┬────────┘
              │                           │
       ┌──────▼────────┐           ┌──────▼────────┐
       │   Redis (Fila)│ ◄─────────┤ Publicação    │
       └──────┬────────┘           └──────┬────────┘
              │                           │
       ┌──────▼───────────────────────────▼──────┐
       │              Workers                    │  <- consomem fila e processam
       └──────┬───────────────────────────┬──────┘
                │                           │
     ┌──────────▼───────────┐    ┌──────────▼───────────┐
     │ Payment Processor     │    │ Payment Processor   │
     │ Default               │    │ Fallback            │
     └──────────┬────────────┘    └──────────┬──────────┘
                │                             │
         ┌──────▼─────────────────────────────▼───────┐
         │                  Redis                     │
         └────────────────────────────────────────────┘


## Rodando o projeto:
- Entre na pasta payment-processor e rode os containers: `cd payment-processor && docker compose up`
- Rode os containers na raiz do projeto: `docker compose up`
- Entre na pasta rinha-test e rode: `k6 run rinha.js`

## Resultado final

    INFO[0062] summaries from 2025-09-06T02:23:56.919Z to 2025-09-06T02:25:06.919Z  source=console
     data_received..................: 2.1 MB   34 kB/s
     data_sent......................: 3.4 MB   55 kB/s
     default_total_amount...........: 332409.6 5394.950764/s
     default_total_fee..............: 16620.48 269.747538/s
     default_total_requests.........: 16704    271.103053/s
     fallback_total_amount..........: 0        0/s
     fallback_total_fee.............: 0        0/s
     fallback_total_requests........: 0        0/s
     http_req_blocked...............: p(99)=512.46µs count=16754
     http_req_connecting............: p(99)=420.46µs count=16754
     http_req_duration..............: p(99)=62.87ms  count=16754
       { expected_response:true }...: p(99)=62.87ms  count=16753
     http_req_failed................: 0.00%    ✓ 1           ✗ 16753
     http_req_receiving.............: p(99)=91µs     count=16754
     http_req_sending...............: p(99)=74µs     count=16754
     http_req_tls_handshaking.......: p(99)=0s       count=16754
     http_req_waiting...............: p(99)=62.85ms  count=16754
     http_reqs......................: 16754    271.914545/s
     iteration_duration.............: p(99)=1.06s    count=16716
     iterations.....................: 16716    271.297811/s
     payments_inconsistency.........: 0        0/s
     total_transactions_amount......: 332409.6 5394.950764/s
     transactions_failure...........: 0        0/s
     transactions_success...........: 16704    271.103053/s
     vus............................: 377      min=5         max=545
     vus_max........................: 554      min=554     

