terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

resource "docker_network" "net" {
  name = "net-${var.id}"
}

locals {
  images = {
    wordpress = "wordpress:latest"
    node      = "node:latest"
    multisite = "nginx:latest"
    debian    = "debian:12"
  }

  internal = {
    wordpress = 80
    node      = 3000
    multisite = 80
    debian    = 22
  }

  envs = {
    wordpress = [
      "WORDPRESS_DB_HOST=db-${var.id}",
      "WORDPRESS_DB_USER=wordpress",
      "WORDPRESS_DB_PASSWORD=${var.root_password}",
      "WORDPRESS_DB_NAME=wordpress"
    ]
    node      = []
    multisite = []
    debian    = []
  }

  commands = {
    wordpress = null
    multisite = null
    node      = ["node", "-e", "require('http').createServer((q,r)=>r.end('Hello Node')).listen(3000)"]
    debian    = ["bash", "-c", "apt-get update && apt-get install -y openssh-server && mkdir -p /run/sshd && echo root:${var.root_password} | chpasswd && sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config && /usr/sbin/sshd -D"]
  }
}

resource "docker_image" "db" {
  count        = var.machine_type == "wordpress" ? 1 : 0
  name         = "mariadb:11"
  keep_locally = true
}

resource "docker_container" "db" {
  count = var.machine_type == "wordpress" ? 1 : 0

  name  = "db-${var.id}"
  image = docker_image.db[0].image_id

  env = [
    "MYSQL_ROOT_PASSWORD=${var.root_password}",
    "MYSQL_DATABASE=wordpress",
    "MYSQL_USER=wordpress",
    "MYSQL_PASSWORD=${var.root_password}"
  ]

  networks_advanced {
    name = docker_network.net.name
  }

  restart = "unless-stopped"
}

resource "docker_image" "vm" {
  name         = local.images[var.machine_type]
  keep_locally = true
}

resource "docker_container" "vm" {
  name  = "provisioned-${var.machine_type}-${var.id}"
  image = docker_image.vm.image_id

  memory  = var.ram
  env     = local.envs[var.machine_type]
  command = local.commands[var.machine_type]

  networks_advanced {
    name = docker_network.net.name
  }

  ports {
    internal = local.internal[var.machine_type]
  }

  restart = "unless-stopped"
  logs    = true

  depends_on = [docker_container.db]
}

output "container_id" {
  value = docker_container.vm.id
}

output "container_name" {
  value = docker_container.vm.name
}

output "container_port" {
  value = docker_container.vm.ports[0].external
}
