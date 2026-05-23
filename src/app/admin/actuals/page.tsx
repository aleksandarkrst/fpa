import ActualImportView from "@/components/ActualImportView";

export default function ActualsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Actual Import</h1>
        <p className="text-sm text-gray-500 mt-1">
          Import actual revenue data for past and actual periods
        </p>
      </div>
      <ActualImportView />
    </div>
  );
}
