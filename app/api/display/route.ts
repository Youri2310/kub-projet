import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbFile = path.join(process.cwd(), "machines.json");

export async function POST(req: NextRequest) {
  const { id } = await req.json();

  let machine: { encryptedPass?: string } | undefined;
  try {
    const all = JSON.parse(fs.readFileSync(dbFile, "utf8"));
    machine = all.find((m: { id: string }) => m.id === id);
  } catch {
    return NextResponse.json({ error: "machines introuvables" }, { status: 500 });
  }

  if (!machine?.encryptedPass) {
    return NextResponse.json({ error: "mot de passe introuvable" }, { status: 404 });
  }

  try {
    const host = process.env.ESP32_HOST ?? "http://192.168.190.137";
    await fetch(host + "/message", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "msg=" + encodeURIComponent(machine.encryptedPass),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ESP32 injoignable" }, { status: 502 });
  }
}
