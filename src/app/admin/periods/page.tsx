import PeriodConfigView from "@/components/PeriodConfigView";

export default function PeriodsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Period Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define the date ranges for past, actual, and planning periods
        </p>
      </div>
      <PeriodConfigView />
    </div>
  );
}
