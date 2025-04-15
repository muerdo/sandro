#!/bin/bash

# Carregar variáveis de ambiente
source .env.local

# Executar o script de teste
npx tsx src/scripts/test-abacatepay.ts
