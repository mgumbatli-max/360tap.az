// Avtomobil brendləri + modellər (Faza 0 starter — frontend/lib/transport-data.ts-dən genişlənir)

export interface SeedBrand {
  slug: string;
  name: string;
  models: string[];
}

export const VEHICLE_BRANDS: SeedBrand[] = [
  { slug: 'mercedes', name: 'Mercedes-Benz', models: ['C 200', 'E 220', 'S 350', 'GLE', 'Vito'] },
  { slug: 'bmw', name: 'BMW', models: ['320', '530', 'X5', 'X6', '730'] },
  { slug: 'toyota', name: 'Toyota', models: ['Corolla', 'Camry', 'Prado', 'RAV4', 'Land Cruiser'] },
  { slug: 'hyundai', name: 'Hyundai', models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Accent'] },
  { slug: 'kia', name: 'Kia', models: ['Rio', 'Optima', 'Sportage', 'Sorento', 'K5'] },
  { slug: 'lada', name: 'LADA (VAZ)', models: ['2107', 'Niva', 'Vesta', 'Granta', 'Priora'] },
  { slug: 'nissan', name: 'Nissan', models: ['Sunny', 'Altima', 'X-Trail', 'Qashqai', 'Patrol'] },
  { slug: 'chevrolet', name: 'Chevrolet', models: ['Cruze', 'Malibu', 'Captiva', 'Cobalt', 'Lacetti'] },
  { slug: 'ford', name: 'Ford', models: ['Focus', 'Mondeo', 'Kuga', 'Transit', 'Fusion'] },
  { slug: 'volkswagen', name: 'Volkswagen', models: ['Polo', 'Passat', 'Jetta', 'Tiguan', 'Golf'] },
];
