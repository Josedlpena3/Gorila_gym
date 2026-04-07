import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { storeUploadedFile } from "@/lib/uploads";
import { requireCurrentUser } from "@/modules/users/user.service";

export async function POST(request: Request) {
  try {
    await requireCurrentUser();
    const formData = await request.formData();
    const proof = formData.get("proof");

    if (!(proof instanceof File) || proof.size <= 0) {
      return NextResponse.json(
        { error: "Debes adjuntar un comprobante válido." },
        { status: 400 }
      );
    }

    const upload = await storeUploadedFile(proof, "payment-proofs");

    return NextResponse.json(
      {
        receipt: {
          ...upload,
          uploadedAt: new Date().toISOString()
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
