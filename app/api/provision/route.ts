import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { execSync } from "child_process";
import path from "path";

const tfDir = path.join(process.cwd(), "terraform");

function tf(cmd: string) {
  return execSync("terraform " + cmd, { cwd: tfDir }).toString();
}

function isAlive(name: string) {
  try {
    return execSync(`docker ps -q --filter name=${name}`).toString().trim() !== "";
  } catch {
    return false;
  }
}

function accessFor(machineType: string, targetNode: string, port: number) {
  if (machineType === "debian") {
    const knownHostsFile = targetNode === "windows" ? "NUL" : "/dev/null";
    return `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=${knownHostsFile} root@localhost -p ${port}`;
  }
  return "http://localhost:" + port;
}

async function sendToEsp(mdp: string) {
  const key = Buffer.from("1234567890abcdef");
  const iv = Buffer.from("abcdef1234567890");
  const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
  const encryptedPass = cipher.update(mdp, "utf8", "base64") + cipher.final("base64");

  const host = process.env.ESP32_HOST ?? "http://192.168.190.137";
  await fetch(host + "/message", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "msg=" + encodeURIComponent(encryptedPass),
  });
}

export async function GET() {
  const machines = [];
  try {
    const list = tf("workspace list")
      .split("\n")
      .map((l) => l.replace("*", "").trim())
      .filter((l) => l && l !== "default");

    for (const ws of list) {
      try {
        tf("workspace select " + ws);
        const out = JSON.parse(tf("output -json"));
        const name = out.container_name?.value;

        if (name && isAlive(name)) {
          const type = out.machine_type?.value ?? "?";
          const node = out.target_node?.value ?? "mac";
          machines.push({
            id: ws,
            machineType: type,
            targetNode: node,
            cpu: out.cpu?.value ?? "?",
            ram: out.ram?.value ?? "?",
            disk: out.disk?.value ?? "?",
            access: out.container_port?.value ? accessFor(type, node, out.container_port.value) : "",
          });
        } else {
          // container supprime dans docker -> on nettoie le workspace orphelin
          try {
            tf(`destroy -auto-approve -var="machine_type=${out.machine_type?.value ?? "debian"}" -var="target_node=${out.target_node?.value ?? "mac"}" -var="cpu=${out.cpu?.value ?? 1}" -var="ram=${out.ram?.value ?? 1024}" -var="disk=${out.disk?.value ?? 10}" -var="id=${ws}"`);
          } catch (e) {
            console.log(e);
          }
          tf("workspace select default");
          tf("workspace delete -force " + ws);
        }
      } catch (e) {
        console.log("workspace " + ws + " ignore :", e);
      }
    }
  } catch (e) {
    console.log(e);
  } finally {
    try {
      tf("workspace select default");
    } catch {}
  }

  return NextResponse.json({ machines });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  console.log("config recue : ", data);

  const id = data.machineType + "-" + crypto.randomBytes(3).toString("hex");

  const vars =
    `-var="machine_type=${data.machineType}" ` +
    `-var="target_node=${data.targetNode}" ` +
    `-var="cpu=${data.cpu}" ` +
    `-var="ram=${data.ram}" ` +
    `-var="disk=${data.disk}" ` +
    `-var="id=${id}"`;

  try {
    execSync("terraform init -input=false", { cwd: tfDir, stdio: "inherit" });
    execSync("terraform workspace new " + id, { cwd: tfDir, stdio: "inherit" });
    execSync("terraform apply -auto-approve -input=false " + vars, { cwd: tfDir, stdio: "inherit" });

    const out = JSON.parse(execSync("terraform output -json", { cwd: tfDir }).toString());
    const port = out.container_port?.value ?? 80;
    const mdp = out.password.value;

    try {
      await sendToEsp(mdp);
    } catch (error) {
      console.log(error);
    }

    const access = accessFor(data.machineType, data.targetNode, port);

    if (data.machineType === "debian") {
      return NextResponse.json({ login: "root", ssh: access });
    }
    return NextResponse.json({ login: "root", link: access });
  } catch (e) {
    console.log("ca a planté avec terraform :", e);
    return NextResponse.json({ error: "erreur terraform" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json();

  try {
    tf("workspace select " + id);
    const mdp = tf("output -raw password").trim();
    await sendToEsp(mdp);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.log("erreur envoi esp32 :", e);
    return NextResponse.json({ error: "impossible d'envoyer le mdp" }, { status: 500 });
  } finally {
    try {
      tf("workspace select default");
    } catch {}
  }
}
