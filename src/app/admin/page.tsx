import MasterDataView from "@/components/MasterDataView";

export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage master data used across the application
        </p>
      </div>
      <MasterDataView />
    </div>
  );
}
