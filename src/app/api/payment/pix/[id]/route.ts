import { NextRequest, NextResponse } from "next/server";
import { checkPixPaymentStatus } from "../pix-payment";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;

    if (!transactionId) {
      return NextResponse.json(
        { message: "ID da transação é obrigatório" },
        { status: 400 }
      );
    }

    // Simula a verificação do status do pagamento PIX
    const response = await checkPixPaymentStatus(
      { params: { transactionId } } as any, // Simula o objeto `req` do Express
      {
        status: () => ({
          json: (data: any) => data, // Simula o objeto `res` do Express
        }),
      } as any
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Erro ao verificar status do pagamento PIX:", error);
    return NextResponse.json(
      { message: "Erro ao verificar status do pagamento PIX" },
      { status: 500 }
    );
  }
}
