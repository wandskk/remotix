import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ApiError } from "@/lib/api/errors";

export function apiOk<T>(data: T, init?: { status?: number }) {
  return NextResponse.json({ success: true, data }, { status: init?.status ?? 200 });
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Dados inválidos.", details: error.flatten() },
      },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: "Erro interno." } },
    { status: 500 },
  );
}
