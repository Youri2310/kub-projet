variable "machine_type" {
  type        = string
  description = "Type de la machine choisis parmis les proposés "
}

variable "target_node" {
  type        = string
  description = "Choix du node (Mac ou Windows)"
}

variable "cpu" {
  type        = number
  description = "Valeur du CPU (0.5 / 1 / 2 coeurs)"
}

variable "ram" {
  type        = number
  description = "Valeur de la Ram choisis (de 512 mo à 8go)"
}

variable "disk" {
  type        = number
  description = "Taille du disque de la machine (de 5go à 100go)"

}
