import { PackageForm } from "@/components/admin/PackageForm";

export const dynamic = "force-dynamic";

export default function NewTripPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">New trip package</h1>
      <div className="mt-6 max-w-4xl">
        <PackageForm />
      </div>
    </div>
  );
}
