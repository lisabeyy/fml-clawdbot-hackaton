export default function PriceChart({ deservedPercent, fmlPercent }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="text-red-600">Deserved</span>
        <span className="text-gray-700">{deservedPercent}%</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
        <div 
          className="bg-red-500 h-full transition-all duration-300"
          style={{ width: `${deservedPercent}%` }}
        />
        <div 
          className="bg-blue-500 h-full transition-all duration-300"
          style={{ width: `${fmlPercent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="text-gray-700">{fmlPercent}%</span>
        <span className="text-blue-600">FML</span>
      </div>
    </div>
  );
}
