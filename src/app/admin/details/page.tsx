"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function PaymentSettings() {
  const [settings, setSettings] = useState({
    pix_key: "",
    bank_name: "",
    bank_agency: "",
    bank_account: "",
    beneficiary_name: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    const { data, error } = await supabase
      .from("payment_settings")
      .select("*")
      .single();

    if (data) {
      setSettings(data);
    }
  };

  const handleSave = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("payment_settings")
        .upsert([settings], { onConflict: "id" });

      if (error) throw error;
      alert("Dados atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configurações de Pagamento</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Chave PIX</label>
          <input
            type="text"
            value={settings.pix_key}
            onChange={(e) =>
              setSettings({ ...settings, pix_key: e.target.value })
            }
            className="w-full p-3 rounded-lg border border-input bg-background"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Nome do Banco</label>
          <input
            type="text"
            value={settings.bank_name}
            onChange={(e) =>
              setSettings({ ...settings, bank_name: e.target.value })
            }
            className="w-full p-3 rounded-lg border border-input bg-background"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Agência</label>
          <input
            type="text"
            value={settings.bank_agency}
            onChange={(e) =>
              setSettings({ ...settings, bank_agency: e.target.value })
            }
            className="w-full p-3 rounded-lg border border-input bg-background"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Conta</label>
          <input
            type="text"
            value={settings.bank_account}
            onChange={(e) =>
              setSettings({ ...settings, bank_account: e.target.value })
            }
            className="w-full p-3 rounded-lg border border-input bg-background"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Nome do Beneficiário
          </label>
          <input
            type="text"
            value={settings.beneficiary_name}
            onChange={(e) =>
              setSettings({ ...settings, beneficiary_name: e.target.value })
            }
            className="w-full p-3 rounded-lg border border-input bg-background"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}