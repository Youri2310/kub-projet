#Provider Docker
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {
  alias    = "mac"
  host     = "ssh://user@localhost:22"
  ssh_opts = ["-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null"]
}

provider "docker" {
  alias = "windows"
  host  = "tcp://localhost:2375"
}

#Mapping
locals {
  images = {
    wordpress = "wordpress:latest"
    node      = "node:latest"
    multisite = "nginx:latest"
    debian    = "debian:12"
  }

  ports = {
    wordpress = [
      { internal = 80, external = 80 },
      { internal = 443, external = 443 }
    ]
    node = [
      { internal = 3000, external = 3000 }
    ]
    multisite = [
      { internal = 80, external = 80 },
      { internal = 443, external = 443 }
    ]
    debian = []
  }

  envs = {
    wordpress = [
      "WORDPRESS_DB_HOST=db",
      "WORDPRESS_DB_USER=root",
      "WORDPRESS_DB_PASSWORD=example",
      "WORDPRESS_DB_NAME=wordpress"
    ]
    node      = []
    multisite = []
    debian    = []
  }
}

resource "docker_image" "vm_mac" {
  count = var.target_node == "mac" ? 1 : 0

  provider     = docker.mac
  name         = local.images[var.machine_type]
  keep_locally = true
}

resource "docker_image" "vm_windows" {
  count = var.target_node == "windows" ? 1 : 0

  provider     = docker.windows
  name         = local.images[var.machine_type]
  keep_locally = true
}

locals {
  image_id = var.target_node == "mac" ? docker_image.vm_mac[0].image_id : docker_image.vm_windows[0].image_id
}


# Démarrer container
resource "docker_container" "vm" {
  name  = "provisioned-${var.machine_type}-${formatdate("YYYYMMDDhhmm", timestamp())}"
  image = local.image_id

  memory = var.ram

  env = local.envs[var.machine_type]

  volumes {
    host_path      = "/var/lib/docker/volumes/${var.machine_type}-data/_data"
    container_path = "/data"
    read_only      = false
  }

  dynamic "ports" {
    for_each = local.ports[var.machine_type]

    content {
      internal = ports.value.internal
      external = ports.value.external
      protocol = "tcp"
    }
  }

  restart = "unless-stopped"
  logs    = true
}


#Sortie
output "container_id" {
  value       = docker_container.vm.id
  description = "ID du conteneur"
}

output "container_name" {
  value       = docker_container.vm.name
  description = "Nom du conteneur"
}
