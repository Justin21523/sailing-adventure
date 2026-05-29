/**
 * ShipyardVisualsPanel.tsx
 * UI for customizing the ship's visual appearance (Sail colors).
 */

import { useShipCustomizationStore } from '@/stores/shipCustomizationStore';

export function ShipyardVisualsPanel() {
  const sailColor = useShipCustomizationStore((s) => s.sailColor);
  const setSailColor = useShipCustomizationStore((s) => s.setSailColor);

  const colors = [
    { name: 'Natural', hex: '#F5F5DC' },
    { name: 'Crimson', hex: '#8B0000' },
    { name: 'Royal', hex: '#00008B' },
    { name: 'Black', hex: '#1A1A1A' },
    { name: 'Gold', hex: '#D4AF37' },
  ];

  return (
    <div className="mt-6 border-t border-sand-light/20 pt-4">
      <h3 className="text-lg font-nautical text-amber-300 mb-3">Sail Customization</h3>
      <div className="flex gap-3 flex-wrap">
        {colors.map((c) => (
          <button
            key={c.hex}
            onClick={() => setSailColor(c.hex)}
            className={`w-12 h-12 rounded-full border-2 transition-all transform hover:scale-110 ${
              sailColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent'
            }`}
            style={{ backgroundColor: c.hex }}
            title={c.name}
          />
        ))}
      </div>
    </div>
  );
}