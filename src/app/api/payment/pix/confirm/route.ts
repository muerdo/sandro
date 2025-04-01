import { NextRequest, NextResponse } from "next/server";
import { confirmPixPayment } from "../pix-payment";

export async function POST(req: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    const { transactionId } = params;

    if (!transactionId) {
      return NextResponse.json({ message: "ID da transação é obrigatório" }, { status: 400 });
    }

    // Simula a confirmação do pagamento PIX
    const response = await confirmPixPayment(
      { params: { transactionId } } as any, // Simula o objeto `req` do Express
      {
        status: () => ({
          json: (data: any) => data, // Simula o objeto `res` do Express
        }),
      } as any
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Erro ao confirmar pagamento PIX:", error);
    return NextResponse.json({ message: "Erro ao confirmar pagamento PIX" }, { status: 500 });
  }
}