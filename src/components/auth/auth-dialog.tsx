"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useVisibility } from "@/contexts/visibility-context";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function AuthDialog({
  isOpen,
  onClose,
  className,
}: AuthDialogProps) {
  // Garantir que o modal seja exibido no centro da tela e com z-index adequado
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn, signUp } = useAuth();

  let visibilityContext: { isCartButtonVisible: boolean; setCartButtonVisible: (visible: boolean) => void } | undefined;
  try {
    visibilityContext = useVisibility();
  } catch (error) {
    console.warn("VisibilityContext não está disponível, ignorando");
  }

  useEffect(() => {
    if (visibilityContext?.setCartButtonVisible) {
      visibilityContext.setCartButtonVisible(!isOpen);
    }
  }, [isOpen, visibilityContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignUp) {
        await signUp(email, password);
        console.log("Cadastro realizado com sucesso");
      } else {
        await signIn(email, password);
        console.log("Login realizado com sucesso");
      }
      onClose();
    } catch (err) {
      console.error("Erro de autenticação:", err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro durante a autenticação");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay de fundo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal de autenticação */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div
              className={`w-full max-w-md bg-background border rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh] ${className}`}
            >
              {/* Cabeçalho do modal */}
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {isSignUp ? "Crie uma conta" : "Bem vindo"}
                  </h2>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1.5 hover:bg-secondary transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? "Cadastre-se" : "Entre na sua conta"}
                </p>
              </div>

              {/* Formulário de autenticação */}
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
                <div className="flex flex-col gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-10 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isSignUp ? "Cadastre-se" : "Entre"}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isSignUp
                      ? "Já tem uma conta? Entre"
                      : "Ainda não tem uma conta? Inscreva-se"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
