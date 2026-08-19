/**
 * Convierte un valor numérico entero en su representación formal en letras (Español / Colombia).
 * Ejemplo: 40000 -> "CUARENTA MIL"
 * Ejemplo: 145000 -> "CIENTO CUARENTA Y CINCO MIL"
 */

const UNIDADES: string[] = [
  "", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"
];

const ESPECIALES: string[] = [
  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
  "VEINTE", "VEINTIUNO", "VEINTIDOS", "VEINTITRES", "VEINTICUATRO", "VEINTICINCO", "VEINTISEIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"
];

const DECENAS: string[] = [
  "", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"
];

const CENTENAS: string[] = [
  "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"
];

function convertirSeccion(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CIEN";

  let c = Math.floor(n / 100);
  let d = Math.floor((n % 100) / 10);
  let u = n % 10;
  let res = "";

  if (c > 0) {
    res += CENTENAS[c] + " ";
  }

  let du = n % 100;
  if (du >= 10 && du <= 29) {
    res += ESPECIALES[du - 10] + " ";
  } else {
    if (d > 0) {
      res += DECENAS[d] + (u > 0 ? " Y " : " ");
    }
    if (u > 0) {
      res += UNIDADES[u] + " ";
    }
  }

  return res.trim();
}

export function numeroALetras(cantidad: number): string {
  const entero = Math.floor(Math.abs(cantidad));
  if (entero === 0) return "CERO PESOS M/CTE";

  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const unidades = entero % 1000;

  let resultado = "";

  if (millones > 0) {
    if (millones === 1) {
      resultado += "UN MILLON ";
    } else {
      resultado += convertirSeccion(millones) + " MILLONES ";
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      resultado += "MIL ";
    } else {
      resultado += convertirSeccion(miles) + " MIL ";
    }
  }

  if (unidades > 0) {
    resultado += convertirSeccion(unidades) + " ";
  }

  return `SON: ${resultado.trim()} PESOS M/CTE`;
}

/**
 * Formatea un número al estándar monetario colombiano: $40.000
 */
export function formatearMonedaCOP(monto: number): string {
  const redondeado = Math.round(monto);
  const partes = redondeado.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${partes}`;
}
