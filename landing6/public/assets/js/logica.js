// Lógica del diagnóstico · Invierte con Respaldo Inmobiliario (diagnostico.pulsoinversor.cl)
// La usan la página (navegador) y el Worker, para que el resultado sea siempre el mismo.
// Reglas de mensaje: sin tasas en piezas públicas; nunca "seguro", "garantizado" ni "sin riesgo".

export const CAPITALES = ['Menos de $5 MM', '$5 a $25 MM', '$25 a $60 MM', '$60 a $150 MM', 'Más de $150 MM'];

// Preguntas de perfil: objetivo, horizonte, experiencia, tolerancia al riesgo y situación financiera.
// Regla de la usuaria: nunca mencionar a la CMF en ninguna pieza.
// Cada opción suma 1, 2 o 3 puntos (orden de la lista).
export const PREGUNTAS = [
  { id: 'objetivo', titulo: '¿Qué buscas principalmente con este dinero?', corto: 'Objetivo',
    opciones: ['Protegerlo de la inflación', 'Recibir una renta periódica', 'Hacerlo crecer en el plazo'] },
  { id: 'horizonte', titulo: '¿Cuándo podrías necesitar este dinero?', corto: 'Lo necesitaría',
    opciones: ['Antes de 12 meses', 'Entre 12 y 24 meses', 'En más de 2 años'] },
  { id: 'experiencia', titulo: '¿En qué has invertido antes?', corto: 'Experiencia',
    opciones: ['Solo depósitos a plazo o cuenta de ahorro', 'Fondos mutuos, APV o acciones', 'Propiedades, deuda privada o crowdfunding'] },
  { id: 'reaccion', titulo: 'Si una inversión tuya bajara 10% en un mes, ¿qué harías?', corto: 'Ante una baja de 10%',
    opciones: ['Retiraría todo', 'Esperaría a que se recupere', 'Aprovecharía de invertir más'] },
  { id: 'proporcion', titulo: '¿Qué parte de tu patrimonio es este monto?', corto: 'Parte del patrimonio',
    opciones: ['Más de la mitad', 'Entre un cuarto y la mitad', 'Menos de un cuarto'] },
  { id: 'ingresos', titulo: '¿Tus ingresos cubren tus gastos sin usar este dinero?', corto: 'Ingresos',
    opciones: ['No, dependo de este dinero', 'Sí, pero con poco margen', 'Sí, con holgura'] },
];

export const SOLUCIONES = {
  renta: {
    nombre: 'Renta de Capital', desde: '$5 MM', plazos: '12, 18 o 24 meses',
    respaldo: 'Mutuo y pagaré ejecutable, respaldado por el portafolio de propiedades de Pulso.',
    extra: 'Permite retiros trimestrales.',
  },
  hipoteca: {
    nombre: 'Hipoteca Inteligente', desde: '$25 MM', plazos: '15, 21 o 27 meses',
    respaldo: 'Hipoteca inscrita a tu favor en el Conservador de Bienes Raíces sobre una propiedad identificada y tasada.',
    extra: 'Tu capital se reajusta en UF.',
  },
  arquitectura: {
    nombre: 'Arquitectura de Capital', desde: '$60 MM', plazos: '15, 21 o 27 meses',
    respaldo: 'La propiedad queda inscrita a tu nombre: eres el dueño.',
    extra: 'Tu capital se reajusta en UF.',
  },
};

export const PERFILES = {
  Conservador: 'Priorizas cuidar tu capital por sobre la rentabilidad. Te conviene el respaldo más directo posible y montos que no comprometan tu tranquilidad.',
  Moderado: 'Buscas un equilibrio entre rentabilidad y respaldo. Aceptas plazos definidos a cambio de un retorno mayor que el del banco.',
  Agresivo: 'Toleras más variación a cambio de una rentabilidad mayor y valoras recibir flujo durante la operación.',
};

const puntos = (pregunta, valor) => {
  const p = PREGUNTAS.find((x) => x.id === pregunta);
  const i = p ? p.opciones.indexOf(valor) : -1;
  return i + 1; // 0 si no es válida
};

// Devuelve null si faltan respuestas o alguna no es válida.
export function diagnosticar(r) {
  if (!CAPITALES.includes(r.capital)) return null;
  let total = 0;
  for (const p of PREGUNTAS) {
    const v = puntos(p.id, r[p.id]);
    if (!v) return null;
    total += v;
  }
  const perfil = total <= 10 ? 'Conservador' : total <= 14 ? 'Moderado' : 'Agresivo';
  const alertas = [];
  let principal = null, alternativa = null, estado = 'apto';

  const cap = CAPITALES.indexOf(r.capital); // 0: <5, 1: 5-25, 2: 25-60, 3: 60-150, 4: >150
  const quiereRenta = r.objetivo === 'Recibir una renta periódica';

  if (cap === 0) {
    estado = 'bajo-minimo';
    alertas.push('Hoy nuestras operaciones parten en $5 millones. Te recomendamos seguir ahorrando y volver a hacer este diagnóstico cuando llegues a ese monto.');
  } else if (r.horizonte === 'Antes de 12 meses') {
    estado = 'no-recomendado';
    alertas.push('Si podrías necesitar este dinero antes de 12 meses, hoy no te recomendamos invertirlo: todas nuestras operaciones tienen un plazo mínimo de 12 meses.');
  } else {
    if (cap === 1) {
      principal = 'renta';
    } else if (cap === 2) {
      if (perfil === 'Agresivo' || quiereRenta) { principal = 'renta'; alternativa = 'hipoteca'; }
      else { principal = 'hipoteca'; alternativa = 'renta'; }
    } else {
      if (perfil === 'Conservador') { principal = 'arquitectura'; alternativa = 'hipoteca'; }
      else if (perfil === 'Agresivo' || quiereRenta) { principal = 'renta'; alternativa = 'hipoteca'; }
      else { principal = 'hipoteca'; alternativa = 'arquitectura'; }
    }
    if (cap === 4) alertas.push('Con más de $150 millones conviene repartir el monto en más de una operación o combinar soluciones. Lo revisas con tu asesor.');
    if (perfil === 'Conservador' && principal === 'renta') alertas.push('Con un perfil conservador, considera partir con una parte menor del monto y revisar el mutuo y el pagaré con tu abogado antes de firmar.');
    if (r.horizonte === 'Entre 12 y 24 meses' && principal !== 'renta') alertas.push('Como podrías necesitar el dinero antes de 2 años, elige el plazo de 15 o 21 meses.');
  }
  if (r.proporcion === 'Más de la mitad') alertas.push('Este monto es más de la mitad de tu patrimonio. Te recomendamos invertir solo una parte y mantener el resto disponible.');
  if (r.ingresos === 'No, dependo de este dinero') alertas.push('Si dependes de este dinero para tus gastos, primero asegura un fondo de reserva. Ninguna inversión con plazo debería comprometer tu día a día.');

  return { perfil, puntaje: total, estado, principal, alternativa, alertas };
}

// Texto consolidado para WhatsApp (respuestas + diagnóstico).
export function mensajeWhatsApp({ nombre, edad, respuestas, diag, folio, duda }) {
  const l = [];
  l.push(`Hola, soy ${nombre}. Hice el diagnóstico en la página de Pulso Inversor${folio ? ` (folio #${folio})` : ''}.`);
  l.push('');
  l.push('*Mis respuestas*');
  l.push(`• Edad: ${edad}`);
  l.push(`• Capital para invertir: ${respuestas.capital}`);
  for (const p of PREGUNTAS) l.push(`• ${p.corto}: ${respuestas[p.id]}`);
  l.push('');
  l.push('*Mi diagnóstico*');
  l.push(`• Perfil: ${diag.perfil}`);
  if (diag.principal) {
    l.push(`• Solución sugerida: ${SOLUCIONES[diag.principal].nombre}`);
    if (diag.alternativa) l.push(`• Alternativa: ${SOLUCIONES[diag.alternativa].nombre}`);
  } else {
    l.push(diag.estado === 'bajo-minimo' ? '• Resultado: aún bajo el monto mínimo' : '• Resultado: hoy no se recomienda invertir (plazo)');
  }
  if (duda) { l.push(''); l.push(`*Mi duda:* ${duda}`); }
  l.push('');
  l.push(diag.principal ? 'Quiero conversar con un asesor.' : 'Me gustaría resolver una duda.');
  return l.join('\n');
}
