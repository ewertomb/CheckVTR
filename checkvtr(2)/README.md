
# ⚡ CheckVTR - RAIO Edition

Sistema avançado de gestão de frota, auditoria de movimentação e manutenção técnica com inteligência artificial. Desenvolvido para unidades operacionais que exigem rigor, controle e prontidão.

## 🚀 Principais Funcionalidades

- **Controle de Movimentação**: Registro de saídas e retornos com integração de odômetro e fotos.
- **Auditoria por IA**: Laudos técnicos automatizados via Google Gemini 2.5 Flash para análise de avarias em fotos.
- **Checklist Tático**: Inspeção de 32 itens vitais para viaturas (VTR).
- **Gestão de Pneus e Manutenção**: Prontuário técnico completo com alertas de vencimento por quilometragem.
- **Controle de Combustível**: Histórico de abastecimentos, média de consumo (KM/L) e saldo de cartões.
- **Multi-Base (Realtime)**: Suporte a múltiplas unidades integradas com sincronização em tempo real via Supabase.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/) com TypeScript e Tailwind CSS.
- **Backend/Database**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime).
- **Inteligência Artificial**: [Google Gemini API](https://ai.google.dev/).
- **PWA**: Suporte para instalação como aplicativo móvel (Manifest & Service Workers).

## ⚙️ Configuração do Ambiente

### 1. Requisitos do Banco de Dados
Execute o conteúdo do arquivo `supabase_schema.sql` no Editor SQL do seu projeto Supabase para criar a estrutura de tabelas e habilitar as notificações em tempo real.

### 2. Variáveis de Ambiente
O projeto utiliza as seguintes chaves:
- `API_KEY` (Gemini AI): Deve ser configurada no ambiente de execução.
- `supabaseUrl` e `supabaseKey`: Configuradas no arquivo `supabaseClient.ts`.

## 👮 Hierarquia de Acesso

1. **PROGRAMADOR**: Gestão global de bases, depuração de dados e ajustes de sistema.
2. **ADMINISTRADOR (P4)**: Gestão de efetivo da unidade, cadastro de viaturas e auditoria de relatórios.
3. **PERMANÊNCIA**: Monitoramento da frota ativa e atualização de manutenção.
4. **OPERACIONAL**: Realização de checklists, registros de uso e abastecimentos.

---
*Desenvolvido para eficiência e transparência nas operações de frota.*
