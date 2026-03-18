export function roleSlugToLabel(roleSlug: string) {
  if (roleSlug === "administrador") {
    return "Administrador";
  }

  if (roleSlug === "gerente") {
    return "Gerente";
  }

  if (roleSlug === "operador") {
    return "Operador";
  }

  return "Usuario";
}
