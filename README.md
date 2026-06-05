# Interface Web - Création de VM personnalisées

Interface web pour déployer des machines virtuelles via Terraform/LXC sur un cluster Proxmox local, avec affichage du mot de passe sur un écran OLED via ESP32.

---

## Stack

- **Next.js** (App Router) — frontend + API routes
- **Terraform** — provisioning des containers LXC sur Proxmox
- **ESP32 + écran OLED** — affichage du mot de passe à la création
- **Arduino** — firmware de l'ESP32 (`arduino/sketch.ino`)

---

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Fonctionnement

### 1. Choix de la machine
L'utilisateur sélectionne un type de container :

| Type | Description |
|---|---|
| WordPress | CMS avec base MySQL |
| Server Node | Environnement Node.js |
| Server Multisite | Nginx multi-sites |
| VPS Debian | Machine Debian brute |

### 2. Configuration des ressources
- **Node cible** : Mac (ARM64) ou Windows (x86) — détermine sur quel hyperviseur Proxmox la VM est déployée
- **CPU** : 0.5 / 1 / 2 cœurs
- **RAM** : 512 Mo → 8 Go
- **Stockage** : 5 → 100 Go

### 3. Provisioning
Au clic sur "Lancer le Provider" :
1. Un mot de passe aléatoire est généré
2. Il est chiffré (AES-128-CBC) et envoyé à l'ESP32 pour affichage sur l'écran OLED
3. Terraform génère le `terraform.tfvars` et crée le container LXC
4. La machine est sauvegardée dans `machines.json`
5. La commande SSH (Debian) ou l'URL d'accès est affichée

### 4. Machines en cours
La page d'accueil liste toutes les machines déjà déployées (lues depuis `machines.json`).  
Chaque carte permet de :
- Copier la commande SSH ou ouvrir l'URL
- Renvoyer le mot de passe chiffré sur l'écran OLED via le bouton **Afficher mdp**

---

## API Routes

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/provision` | Liste toutes les machines (`machines.json`) |
| `POST` | `/api/provision` | Lance le provisioning Terraform |
| `POST` | `/api/display` | Renvoie le mot de passe chiffré à l'ESP32 |

---

## Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
ESP32_HOST=http://<ip-de-l-esp32>
```

Par défaut : `http://192.168.190.137`

---

## Commande SSH

La commande générée s'adapte automatiquement selon le node cible :

- **Mac** : `UserKnownHostsFile=/dev/null`
- **Windows** : `UserKnownHostsFile=NUL`

Si la clé hôte a changé (VM recréée), supprimer l'ancienne entrée :

```bash
ssh-keygen -R "[localhost]:<port>"
```
