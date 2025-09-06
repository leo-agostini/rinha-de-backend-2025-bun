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
