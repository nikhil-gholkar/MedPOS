export default function AppLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
        M
      </div>

      <div>
        <h2 className="font-bold">
          MedPOS
        </h2>

        <p className="text-xs text-gray-500">
          Medical ERP
        </p>
      </div>
    </div>
  );
}