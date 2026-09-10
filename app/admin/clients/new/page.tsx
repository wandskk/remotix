import { ClientForm } from "@/components/admin/client-form";

export default function NewClientPage() {
  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Novo cliente</h1>
      <ClientForm />
    </div>
  );
}
