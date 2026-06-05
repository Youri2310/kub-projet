import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const tfDir = path.join(process.cwd(), "terraform");

export async function POST(req: NextRequest) {
  const data = await req.json();
  console.log("config recue : ", data);

  const mdp = crypto.randomBytes(8).toString("hex");
  try {
    const key = Buffer.from("1234567890abcdef");
    const iv = Buffer.from("abcdef1234567890");
    const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
    let enc = cipher.update(mdp, "utf8", "base64");
    enc += cipher.final("base64");

    const host = process.env.ESP32_HOST ?? "http://192.168.190.137";
    await fetch(host + "/message", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "msg=" + encodeURIComponent(enc),
    });
  } catch (error) {
    console.log(error);
  }

  const vars = `machine_type = "${data.machineType}"
target_node = "${data.targetNode}"
cpu = ${data.cpu}
ram = ${data.ram}
disk = ${data.disk}
root_password = "${mdp}"`;

  fs.writeFileSync(path.join(tfDir, "terraform.tfvars"), vars);

  try {
    execSync("terraform init -input=false", { cwd: tfDir, stdio: "inherit" });
    execSync("terraform apply -auto-approve -input=false", { cwd: tfDir, stdio: "inherit" });

    const out = JSON.parse(execSync("terraform output -json", { cwd: tfDir }).toString());
    const port = out.container_port?.value ?? 80;

    if (data.machineType === "debian") {
      return NextResponse.json({
        login: "root",
        ssh: "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL root@localhost -p " + port,
        pass: mdp,
      });
    }

    return NextResponse.json({
      login: "root",
      link: "http://localhost:" + port,
      pass: mdp,
    });
  } catch (e) {
    console.log("ca a planté avec terraform :", e);
    return NextResponse.json({ error: "erreur terraform" }, { status: 500 });
  }
}
