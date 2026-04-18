import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { storeUploadedFile } from "@/lib/uploads";
import { requireAdminUser } from "@/modules/users/user.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Debes adjuntar al menos una imagen." },
        { status: 400 }
      );
    }

    const uploadedFiles = await Promise.all(
      files.map((file) => storeUploadedFile(file, "products"))
    );
    const firstUrl = uploadedFiles[0]?.url ?? null;

    uploadedFiles.forEach((file) => {
      console.log("Imagen subida:", file.url);
    });

    return NextResponse.json(
      {
        url: firstUrl,
        files: uploadedFiles
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
