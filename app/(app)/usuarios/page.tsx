"use client";

import { useState } from "react";
import { PlusIcon, UsersIcon } from "@phosphor-icons/react";

import { Badge, Button, EmptyState, Field, Input, Modal, Select } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  useCreateUser,
  useSetUserActive,
  useUsers,
} from "@/core/users/hooks";
import { ROLE_LABELS, type Role, type UserDTO } from "@/core/users/schemas";

export default function UsuariosPage() {
  const users = useUsers();
  const setActive = useSetUserActive();
  const [formOpen, setFormOpen] = useState(false);

  function toggle(u: UserDTO) {
    const msg = u.active
      ? `¿Desactivar a "${u.name}"? No va a poder iniciar sesión.`
      : `¿Reactivar a "${u.name}"? Va a poder volver a iniciar sesión.`;
    if (!window.confirm(msg)) return;
    setActive.mutate({ id: u.id, active: !u.active });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Usuarios</h1>
          <p className="text-sm text-fg-muted">Empleados y administradores del negocio.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <PlusIcon size={18} weight="bold" /> Nuevo usuario
        </Button>
      </div>

      {setActive.error && (
        <p className="mb-4 rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {(setActive.error as Error).message}
        </p>
      )}

      {users.isLoading ? (
        <p className="py-16 text-center text-sm text-fg-muted">Cargando usuarios…</p>
      ) : (users.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<UsersIcon size={34} />}
          title="Sin usuarios"
          description="Creá el primer usuario para dar acceso al sistema."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {users.data!.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold text-fg">
                    {u.name}
                    {!u.active && <Badge tone="neutral">Inactivo</Badge>}
                  </p>
                  <p className="truncate text-xs text-fg-subtle">
                    {u.email} · Alta {formatDate(u.createdAt)}
                  </p>
                </div>
                <Badge tone={u.role === "ADMIN" ? "accent" : "neutral"}>
                  {ROLE_LABELS[u.role]}
                </Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={setActive.isPending}
                  onClick={() => toggle(u)}
                >
                  {u.active ? "Desactivar" : "Activar"}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <NewUserModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}

function NewUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createUser = useCreateUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("EMPLEADO");
  const [error, setError] = useState<string | null>(null);

  // Reset al abrir (patrón de ajuste en render, sin efecto).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("EMPLEADO");
      setError(null);
    }
  }

  const valid = name.trim() !== "" && /\S+@\S+\.\S+/.test(email) && password.length >= 8;

  function submit() {
    setError(null);
    if (!valid) {
      setError("Revisá los datos: nombre, email válido y contraseña de 8+ caracteres.");
      return;
    }
    createUser.mutate(
      { name: name.trim(), email: email.trim(), password, role },
      {
        onSuccess: () => onClose(),
        onError: (e) => setError(e instanceof Error ? e.message : "No se pudo crear."),
      }
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo usuario"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!valid || createUser.isPending}>
            {createUser.isPending ? "Creando…" : "Crear usuario"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Nombre" htmlFor="u-name" required>
          <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Email" htmlFor="u-email" required>
          <Input
            id="u-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="empleado@negocio.com"
          />
        </Field>
        <Field label="Contraseña" htmlFor="u-pass" hint="Mínimo 8 caracteres" required>
          <Input
            id="u-pass"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña inicial"
          />
        </Field>
        <Field label="Rol" htmlFor="u-role">
          <Select id="u-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="EMPLEADO">Empleado (POS y ventas)</option>
            <option value="ADMIN">Administrador (acceso total)</option>
          </Select>
        </Field>
        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
