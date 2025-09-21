import { NextResponse } from "next/server";
import { uploadImagesAction } from "@/app/dashboard/images/minio-actions";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    console.log(
      "Received files for upload:",
      files.map(f => f.name)
    );

    const fileData = await Promise.all(
      files.map(async file => ({
        name: file.name,
        type: file.type,
        arrayBuffer: await file.arrayBuffer()
      }))
    );

    await uploadImagesAction(fileData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      {
        error: "Failed to upload files",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
