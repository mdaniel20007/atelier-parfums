// Zonas de entrega y reglas de envío/pago. Lo usan la tienda (navegador) y la API (servidor).
export const TEGUS = 'Tegucigalpa / Comayagüela';
export const ZONAS = [
  TEGUS,
  'Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán', 'Cortés', 'El Paraíso',
  'Francisco Morazán (otros municipios)', 'Gracias a Dios', 'Intibucá', 'Islas de la Bahía',
  'La Paz', 'Lempira', 'Ocotepeque', 'Olancho', 'Santa Bárbara', 'Valle', 'Yoro',
];
export const esTegus = (zona) => zona === TEGUS;

// Métodos de pago: efectivo contra entrega solo en Tegucigalpa; transferencia en todo el país.
export const PAGOS = { efectivo: 'Efectivo contra entrega', transferencia: 'Transferencia bancaria' };
export const pagosPara = (zona) => (esTegus(zona) ? ['efectivo', 'transferencia'] : ['transferencia']);

const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Math.max(0, Math.round(Number(v))));

// Costo de envío según Ajustes. Devuelve un número (0 = gratis) o null si está "por confirmar".
export function costoEnvio(ajustes, zona, subtotal) {
  if (!zona) return null;
  const gratis = num(ajustes && ajustes.envio_gratis);
  if (gratis && subtotal >= gratis) return 0;
  return num(esTegus(zona) ? ajustes && ajustes.envio_tegus : ajustes && ajustes.envio_nacional);
}
