#!/bin/bash

# Instalar dependências necessárias para o projeto
echo "Instalando dependências para o projeto..."

# Dependências principais
npm install @radix-ui/react-label @radix-ui/react-tabs class-variance-authority react-imask

# Verificar se as dependências já estão instaladas
if ! npm list framer-motion &>/dev/null; then
  npm install framer-motion
fi

if ! npm list sonner &>/dev/null; then
  npm install sonner
fi

if ! npm list clsx &>/dev/null; then
  npm install clsx
fi

if ! npm list tailwind-merge &>/dev/null; then
  npm install tailwind-merge
fi

echo "Dependências instaladas com sucesso!"
echo "Agora você pode executar 'npm run dev' para iniciar o projeto."
