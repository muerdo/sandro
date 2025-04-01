import request from "supertest";
import { generatePixCode } from "@/app/api/payment/pix/pix";
import { supabase } from "@/lib/supabase";

describe("PIX Payment API", () => {
  let transactionId: string;

  // Teste para gerar um pagamento PIX
  it("should generate a PIX payment", async () => {
    const response = await request(app)
      .post("/api/payment/pix")
      .send({
        amount: 100.0,
        description: "Pagamento de teste",
        pixKey: "59f7435a-b326-4cc2-9f68-f1b6be3c6d10",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("transactionId");
    expect(response.body).toHaveProperty("pixCode");
    expect(response.body).toHaveProperty("qrCodeImage");

    transactionId = response.body.transactionId;
  });

  // Teste para confirmar o pagamento PIX
  it("should confirm a PIX payment", async () => {
    const response = await request(app)
      .post(`/api/payment/pix/confirm/${transactionId}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "COMPLETED");
  });

  // Teste para verificar o status do pagamento PIX
  it("should check the PIX payment status", async () => {
    const response = await request(app)
      .get(`/api/payment/pix/status/${transactionId}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "COMPLETED");
  });

  // Limpeza após os testes
  afterAll(async () => {
    await supabase
      .from("pixtransactions")
      .delete()
      .eq("transactionid", transactionId);
  });
});