import type { TopAdRow } from '@/lib/dashboard-types';

interface TopAdsTableProps {
  ads: TopAdRow[];
}

export function TopAdsTable({ ads }: TopAdsTableProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="px-6 py-5 border-b border-neutral-100">
        <h2 className="text-base font-medium text-neutral-900 tracking-tight">Top 3 anúncios</h2>
        <p className="text-sm text-neutral-500 mt-1">Melhor ROAS no período selecionado</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-neutral-500">
              <th className="px-6 py-3 font-medium">Anúncio</th>
              <th className="px-6 py-3 font-medium text-right">Investimento</th>
              <th className="px-6 py-3 font-medium text-right">CPC</th>
              <th className="px-6 py-3 font-medium text-right">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {ads.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-neutral-500">
                  Nenhum anúncio com dados neste período.
                </td>
              </tr>
            ) : (
              ads.map((ad, index) => (
                <tr
                  key={`${ad.name}-${index}`}
                  className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/80 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-neutral-900 max-w-[240px] truncate">
                    <span className="text-neutral-400 font-normal mr-2 tabular-nums">{index + 1}.</span>
                    {ad.name}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{ad.spend}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{ad.cpc}</td>
                  <td className="px-6 py-4 text-right tabular-nums font-medium text-neutral-900">{ad.roas}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
