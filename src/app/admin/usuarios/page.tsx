import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { listUsers } from "@/modules/users/user.service";

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Usuarios</p>
        <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Clientes y administradores
        </h1>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <article key={user.id} className="section-card p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={user.role.key === "ADMIN" ? "success" : "default"}>
                    {user.role.label}
                  </Badge>
                  <Badge>{user.orders.length} pedidos</Badge>
                </div>
                <h2 className="mt-4 text-2xl font-black uppercase tracking-[0.08em] text-sand">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="mt-2 text-sm text-mist">{user.email}</p>
                <p className="text-sm text-mist">{user.phone}</p>
              </div>
              <p className="text-sm text-mist">
                Alta: <span className="text-sand">{formatDate(user.createdAt)}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

