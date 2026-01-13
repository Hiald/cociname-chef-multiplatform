/**
 * Funciones helper para formateo de datos
 */

/**
 * Retorna el nombre de la categoría de ingrediente
 */
export function getCategoryName(categoryId: number): string {
  switch (categoryId) {
    case 1: return "Proteína";
    case 2: return "Carbohidratos";
    case 3: return "Verduras";
    case 4: return "Básicos de cocina";
    case 5: return "Especias";
    case 6: return "Lácteos";
    case 7: return "Frutos secos";
    case 8: return "Otros";
    case 9: return "Frutas";
    case 10: return "Menestras";
    default: return "-";
  }
}

/**
 * Retorna el nombre de la unidad de medida
 */
export function getUnitName(unitId: number): string {
  switch (unitId) {
    case 1: return "Unidad (un)";
    case 2: return "Kilogramos (kg)";
    case 4: return "Litros (lt)";
    case 6: return "Cucharada (cda)";
    case 7: return "Cucharadita (cdta)";
    case 8: return "Atado";
    case 9: return "Hojas";
    case 10: return "Ramita";
    default: return "-";
  }
}

/**
 * Retorna la abreviatura de la unidad de medida
 */
export function getUnitAbbreviation(unitId: number): string {
  switch (unitId) {
    case 1: return "un";
    case 2: return "kg";
    case 4: return "lt";
    case 6: return "cda";
    case 7: return "cdta";
    case 8: return "atado";
    case 9: return "hojas";
    case 10: return "ramita";
    default: return "";
  }
}

/**
 * Formatea el tamaño/cantidad según la unidad
 * - kg: convierte a gramos si es < 1kg
 * - litros: convierte a ml si es < 1lt
 * - otras unidades: muestra el valor con la abreviatura
 */
export function formatSize(size: number, unit = 2): string {
  const value = parseFloat(size.toString());
  
  // Kilogramos (unit = 2)
  if (unit === 2) {
    if (value < 1) {
      const fraccion = value;
      
      if (fraccion === 0.25) {
        return "1/4 kg";
      } else if (fraccion === 0.5) {
        return "1/2 kg";
      } else if (fraccion === 0.75) {
        return "3/4 kg";
      } else {
        const gramos = Math.round(value * 1000);
        return gramos + " gr";
      }
    } else {
      return value.toFixed(2) + " kg";
    }
  }
  
  // Litros (unit = 4)
  if (unit === 4) {
    if (value < 1) {
      const mililitros = Math.round(value * 1000);
      return mililitros + " ml";
    } else {
      return value.toFixed(2) + " lt";
    }
  }
  
  // Otras unidades: mostrar valor + abreviatura
  const abbreviation = getUnitAbbreviation(unit);
  
  // Para unidades, mostrar número entero si es entero
  if (unit === 1 && Number.isInteger(value)) {
    return value + " " + abbreviation;
  }
  
  return value.toFixed(2) + " " + abbreviation;
}

/**
 * Formatea la cantidad de un ingrediente (usa size si uM_value es 0)
 */
export function formatIngredientQuantity(ingredient: any): string {
  const value = ingredient.uM_value && ingredient.uM_value > 0 
    ? ingredient.uM_value 
    : parseFloat(ingredient.size || 0);
  
  return formatSize(value, ingredient.unit);
}

/**
 * Retorna el nombre del concepto de pago
 */
export function getConceptName(conceptId: number): string {
  switch (conceptId) {
    case 1: return "Cocina";
    case 2: return "Compras";
    case 3: return "Movilidad";
    case 4: return "Otro";
    default: return "-";
  }
}

/**
 * Retorna el nombre del distrito por su ID
 */
export function getDistrictName(districtId: number): string {
  switch (districtId) {
    case 1: return "ANCON";
    case 2: return "ATE";
    case 3: return "BARRANCO";
    case 4: return "BREÑA";
    case 5: return "CARABAYLLO";
    case 6: return "CHACLACAYO";
    case 7: return "CHORRILLOS";
    case 8: return "CIENEGUILLA";
    case 9: return "COMAS";
    case 10: return "EL AGUSTINO";
    case 11: return "INDEPENDENCIA";
    case 12: return "JESUS MARIA";
    case 13: return "LA MOLINA";
    case 14: return "LA VICTORIA";
    case 15: return "LIMA";
    case 16: return "LINCE";
    case 17: return "LOS OLIVOS";
    case 18: return "LURIGANCHO";
    case 19: return "LURIN";
    case 20: return "MAGDALENA DEL MAR";
    case 21: return "MIRAFLORES";
    case 22: return "PACHACAMAC";
    case 23: return "PUCUSANA";
    case 24: return "PUEBLO LIBRE";
    case 25: return "PUENTE PIEDRA";
    case 26: return "PUNTA HERMOSA";
    case 27: return "PUNTA NEGRA";
    case 28: return "RIMAC";
    case 29: return "SAN BARTOLO";
    case 30: return "SAN BORJA";
    case 31: return "SAN ISIDRO";
    case 32: return "SAN JUAN DE LURIGANCHO";
    case 33: return "SAN JUAN DE MIRAFLORES";
    case 34: return "SAN LUIS";
    case 35: return "SAN MARTIN DE PORRES";
    case 36: return "SAN MIGUEL";
    case 37: return "SANTA ANITA";
    case 38: return "SANTA MARIA DEL MAR";
    case 39: return "SANTA ROSA";
    case 40: return "SANTIAGO DE SURCO";
    case 41: return "SURQUILLO";
    case 42: return "VILLA EL SALVADOR";
    case 43: return "VILLA MARIA DEL TRIUNFO";
    case 44: return "CALLAO";
    default: return "-";
  }
}
