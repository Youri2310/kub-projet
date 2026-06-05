import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const tfDir = path.join(process.cwd(), "terraform");
const dbFile = path.join(process.cwd(), "machines.json");

function readMachines() {
  try {
    return JSON.parse(fs.readFileSync(dbFile, "utf8"));
  } catch {
    return [];
  }
}

function saveMachine(m: object) {
  const all = readMachines();
  all.unshift(m);
  fs.writeFileSync(dbFile, JSON.stringify(all, null, 2));
}

export async function GET() {
  return NextResponse.json({ machines: readMachines() });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  console.log("config recue : ", data);

  const mdp = crypto.randomBytes(8).toString("hex");
  let encryptedPass = "";
  try {
    const key = Buffer.from("1234567890abcdef");
    const iv = Buffer.from("abcdef1234567890");
    const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
    encryptedPass = cipher.update(mdp, "utf8", "base64") + cipher.final("base64");

    const host = process.env.ESP32_HOST ?? "http://192.168.190.137";
    await fetch(host + "/message", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "msg=" + encodeURIComponent(encryptedPass),
    });
  } catch (error) {
    console.log(error);
  }

  const id = data.machineType + "-" + crypto.randomBytes(3).toString("hex");

  const vars =
    `-var="machine_type=${data.machineType}" ` +
    `-var="target_node=${data.targetNode}" ` +
    `-var="cpu=${data.cpu}" ` +
    `-var="ram=${data.ram}" ` +
    `-var="disk=${data.disk}" ` +
    `-var="root_password=${mdp}" ` +
    `-var="id=${id}"`;

  try {
    execSync("terraform init -input=false", { cwd: tfDir, stdio: "inherit" });
    execSync("terraform workspace new " + id, { cwd: tfDir, stdio: "inherit" });
    execSync("terraform apply -auto-approve -input=false " + vars, { cwd: tfDir, stdio: "inherit" });

    const out = JSON.parse(execSync("terraform output -json", { cwd: tfDir }).toString());
    const port = out.container_port?.value ?? 80;

    const knownHostsFile = data.targetNode === "windows" ? "NUL" : "/dev/null";
    const isDebian = data.machineType === "debian";
    const access = isDebian
      ? `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=${knownHostsFile} root@localhost -p ${port}`
      : "http://localhost:" + port;

    saveMachine({
      id,
      machineType: data.machineType,
      targetNode: data.targetNode,
      cpu: data.cpu,
      ram: data.ram,
      disk: data.disk,
      port,
      access,
      encryptedPass,
      createdAt: new Date().toISOString(),
    });

    if (isDebian) {
      return NextResponse.json({ login: "root", ssh: access, pass: mdp });
    }
    return NextResponse.json({ login: "root", link: access, pass: mdp });
  } catch (e) {
    console.log("ca a planté avec terraform :", e);
    return NextResponse.json({ error: "erreur terraform" }, { status: 500 });
  }
}
