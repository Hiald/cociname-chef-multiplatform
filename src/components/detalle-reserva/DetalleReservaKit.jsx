// Kit de componentes compartidos para las fichas de detalle de reserva.
// Replica pixel-a-pixel el diseño del detalle asignado (reservationDetail.jsx),
// que es el diseño canónico. Las fichas públicas (public-*.jsx) deben consumir
// estos componentes para quedar visualmente iguales al detalle que ve la
// cocinera logueada — y no volver a desfasarse cuando el diseño evolucione.
//
// Nota: solo primitivas de PRESENTACIÓN. La lógica privada del flujo asignado
// (botones llegué/culminé, checkboxes de compras, aceptar/rechazar) NO vive
// aquí — esas siguen siendo exclusivas de las pantallas asignadas.
import React from 'react';
import { spacing } from '../../styles';
import profileIcon from '../../assets/images/detalle/perfil.png';
import helpIcon from '../../assets/images/detalle/ayuda.png';
import rightIcon from '../../assets/images/detalle/right.png';

// Misma sombra que reservationDetail.jsx (CARD_SHADOW).
export const CARD_SHADOW = '0px 2px 4px 0px #289FDF0A, 0px 7px 7px 0px #289FDF0A, 0px 15px 9px 0px #289FDF05, 0px 26px 10px 0px #289FDF03, 0px 41px 11px 0px #289FDF00';

export const SUPPORT_CONTACT_URL = 'https://api.whatsapp.com/send/?phone=51963138202&text=Hola%21+Vengo+de+la+plataforma+y+tengo+una+consulta';

// Contenedor de página (fondo gris claro, columna completa).
export function DetalleContainer({ children, style }) {
  return <div style={{ ...kit.container, ...style }}>{children}</div>;
}

// Área de contenido con el padding estándar.
export function DetalleContent({ children, style }) {
  return <div style={{ ...kit.contentContainer, ...style }}>{children}</div>;
}

// Header superior de página: opcionalmente botón "Volver" y badge de estado.
// En fichas públicas normalmente no hay "Volver"; se puede usar solo el badge.
export function DetalleHeader({ children }) {
  return <div style={kit.header}>{children}</div>;
}

export function StatusBadge({ text, bgColor = '#EAF4FB', color = '#1763C9' }) {
  if (!text) return null;
  return (
    <div style={{ ...kit.statusBadge, backgroundColor: bgColor }}>
      <span style={{ ...kit.statusBadgeText, color }}>{text}</span>
    </div>
  );
}

// Nombre del cliente con el icono de perfil (encabezado grande).
// subtitulo: texto pequeño opcional debajo (ej. "Vista pública").
export function CustomerHeader({ nombre, subtitulo }) {
  return (
    <div style={kit.customerHeader}>
      <div style={kit.customerNameRow}>
        <img src={profileIcon} alt="" style={kit.headerIcon} />
        <h2 style={kit.customerName}>{nombre}</h2>
      </div>
      {subtitulo ? <p style={kit.customerSubtitle}>{subtitulo}</p> : null}
    </div>
  );
}

// Tarjeta blanca de filas de información (fecha, hora, personas, etc.).
// rows: [{ icon, label }] — icon es el import de la imagen (png).
export function InfoCard({ rows }) {
  const visibles = (rows || []).filter(r => r && r.label);
  if (!visibles.length) return null;
  return (
    <div style={kit.infoCardContainer}>
      {visibles.map((row, index) => (
        <div key={index} style={kit.infoRow}>
          {row.icon ? <img src={row.icon} alt="" style={kit.infoRowIcon} /> : null}
          <span style={kit.infoRowLabel}>{row.label}</span>
        </div>
      ))}
    </div>
  );
}

// Sección con encabezado (icono + título) y tarjeta blanca de contenido.
// Versión NO colapsable — para fichas públicas. El detalle asignado mantiene
// su propia versión colapsable local.
export function Seccion({ icon, titulo, children }) {
  return (
    <div style={kit.section}>
      <div style={kit.sectionHeader}>
        {icon ? <img src={icon} alt="" style={kit.sectionHeaderIcon} /> : null}
        <h3 style={kit.sectionTitle}>{titulo}</h3>
      </div>
      <div style={kit.card}>{children}</div>
    </div>
  );
}

// Contenido de la sección Ubicación (dirección + distrito opcional + referencia + botón Maps opcional).
export function UbicacionContenido({ direccion, distrito, referencia, onAbrirMaps }) {
  return (
    <>
      <p style={kit.addressText}>{direccion || '-'}</p>
      {distrito ? <p style={kit.districtText}>{distrito}</p> : null}
      <p style={kit.referenceText}>{referencia || 'Sin referencia registrada'}</p>
      {onAbrirMaps ? (
        <button style={kit.mapButton} onClick={onAbrirMaps} type="button">
          <span style={kit.mapButtonText}>Abrir en Maps</span>
        </button>
      ) : null}
    </>
  );
}

// Lista de ingredientes de compra con checkboxes (estado controlado por el padre).
// ingredientes: [{ id, ingredientName, quantity }]
export function ListaIngredientes({ ingredientes, checked, onCheck, subtitulo }) {
  if (!ingredientes || !ingredientes.length) {
    return <p style={kit.emptyText}>No hay ingredientes registrados</p>;
  }
  return (
    <>
      {subtitulo ? <p style={kit.shoppingListSubtitle}>{subtitulo}</p> : null}
      {ingredientes.map((ingrediente) => (
        <div key={ingrediente.id} style={kit.ingredientRow}>
          <input
            type="checkbox"
            checked={(checked && checked[ingrediente.id]) || false}
            onChange={() => onCheck && onCheck(ingrediente.id)}
            style={kit.checkbox}
          />
          <div style={kit.ingredientInfo}>
            <span style={kit.ingredientName}>{ingrediente.ingredientName}</span>
            <span style={kit.ingredientQuantity}>{ingrediente.quantity}</span>
          </div>
        </div>
      ))}
    </>
  );
}

// Lista de platos con "Ver receta" (tarjetas celestes).
// platos: [{ key?, nombre, porciones, onVerReceta? }]
export function ListaPlatos({ platos, emptyText = 'No hay platos registrados' }) {
  if (!platos || !platos.length) {
    return <p style={kit.emptyText}>{emptyText}</p>;
  }
  return (
    <>
      {platos.map((plato, index) => (
        <div key={plato.key || index} style={kit.dishCard}>
          <p style={kit.dishName}>{plato.nombre}</p>
          <div style={kit.dishFooter}>
            <span style={kit.portionsText}>{plato.porciones}</span>
            {plato.onVerReceta ? (
              <button style={kit.viewRecipeButton} onClick={plato.onVerReceta} type="button">
                <span style={kit.viewRecipeText}>Ver receta</span>
                <img src={rightIcon} alt="" style={kit.recipeArrowIcon} />
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </>
  );
}

// Desglose de montos con total (contenido de "Mi ganancia"/"Detalle del servicio").
// conceptos: [{ label, valor }] — valor ya formateado (ej. "S/ 150.00").
export function BloqueMonto({ conceptos, totalLabel = 'Total', totalValor }) {
  return (
    <>
      {(conceptos || []).map((concepto, index) => (
        <div key={index} style={kit.garantiaRow}>
          <span style={kit.garantiaLabel}>{concepto.label}</span>
          <span style={kit.garantiaValue}>{concepto.valor}</span>
        </div>
      ))}
      <div style={kit.divider} />
      <div style={kit.garantiaRow}>
        <span style={kit.garantiaTotal}>{totalLabel}</span>
        <span style={kit.garantiaTotalValue}>{totalValor}</span>
      </div>
    </>
  );
}

// Comentarios del cliente (tarjeta blanca simple, sin encabezado de sección).
export function ComentariosCliente({ texto }) {
  if (!texto) return null;
  return (
    <div style={kit.section}>
      <div style={kit.card}>
        <p style={kit.commentLabel}>Comentarios del cliente</p>
        <p style={kit.commentText}>{texto}</p>
      </div>
    </div>
  );
}

// Bloque "¿Necesitas ayuda?" con botón a WhatsApp de soporte.
export function HelpSection({ url = SUPPORT_CONTACT_URL }) {
  return (
    <div style={kit.helpSection}>
      <p style={kit.helpTitle}>¿Necesitas ayuda?</p>
      <p style={kit.helpText}>Comunícate con una asesora</p>
      <button
        style={kit.helpButton}
        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        type="button"
      >
        <img src={helpIcon} alt="" style={kit.helpIcon} />
        <span style={kit.helpButtonText}>Ayuda con el servicio</span>
      </button>
    </div>
  );
}

// Estados de carga y error de página completa (mismos del detalle asignado).
export function LoadingScreen() {
  return (
    <div style={kit.loadingContainer}>
      <div style={kit.spinner} />
    </div>
  );
}

export function ErrorScreen({ mensaje = 'No se pudo cargar la información.' }) {
  return (
    <div style={kit.errorContainer}>
      <p style={kit.errorText}>{mensaje}</p>
    </div>
  );
}

// Estilos — copiados 1:1 de reservationDetail.jsx (el diseño canónico).
const kit = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#F5F7FA',
    overflowX: 'hidden',
  },
  contentContainer: {
    flex: 1,
    padding: `${spacing.medium}px ${spacing.medium}px 20px`,
    maxWidth: '100%',
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.medium}px ${spacing.medium}px ${spacing.small}px`,
    backgroundColor: '#FFFFFF',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
  },
  statusBadgeText: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  customerHeader: {
    paddingBottom: `${spacing.small}px`,
    marginBottom: `${spacing.small}px`,
  },
  customerNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIcon: {
    width: '24px',
    height: '24px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  customerName: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1C2837',
    margin: 0,
  },
  customerSubtitle: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '4px 0 0 34px',
  },
  infoCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: `${spacing.medium}px`,
    marginBottom: `${spacing.medium}px`,
    boxShadow: CARD_SHADOW,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '7px 0',
    gap: '10px',
  },
  infoRowIcon: {
    width: '18px',
    height: '18px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  infoRowLabel: {
    fontSize: '14px',
    color: '#1A1F24',
    fontWeight: '500',
    lineHeight: '18px',
  },
  section: {
    marginBottom: `${spacing.large}px`,
  },
  sectionHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10px',
    marginBottom: `${spacing.small}px`,
  },
  sectionHeaderIcon: {
    width: '20px',
    height: '20px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
    margin: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: `${spacing.medium}px`,
    boxShadow: CARD_SHADOW,
  },
  addressText: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: '4px',
  },
  districtText: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: `${spacing.small}px`,
  },
  shoppingListSubtitle: {
    fontSize: '13px',
    color: '#6B7280',
    margin: `0 0 ${spacing.medium}px 0`,
  },
  ingredientRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid #F3F4F6',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    marginRight: `${spacing.small}px`,
    cursor: 'pointer',
    accentColor: '#FF5136',
  },
  ingredientInfo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  ingredientName: {
    fontSize: '14px',
    color: '#1A1F24',
    fontWeight: '500',
    marginBottom: '2px',
  },
  ingredientQuantity: {
    fontSize: '12px',
    color: '#6B7280',
  },
  referenceText: {
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: '20px',
    marginBottom: `${spacing.medium}px`,
  },
  mapButton: {
    backgroundColor: '#FF51361A',
    padding: '10px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  mapButtonText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FF5136',
  },
  dishCard: {
    backgroundColor: '#EAF4FB',
    borderRadius: '18px',
    padding: `${spacing.medium}px`,
    boxShadow: CARD_SHADOW,
    marginBottom: `${spacing.medium}px`,
  },
  dishName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: '4px',
  },
  dishFooter: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portionsText: {
    fontSize: '13px',
    color: '#6B7280',
  },
  viewRecipeButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  viewRecipeText: {
    fontSize: '13px',
    color: '#3B82F6',
    fontWeight: '500',
    marginRight: '4px',
  },
  recipeArrowIcon: {
    width: '16px',
    height: '16px',
    objectFit: 'contain',
    display: 'block',
  },
  garantiaRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  garantiaLabel: {
    fontSize: '14px',
    color: '#6B7280',
  },
  garantiaValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1F24',
  },
  divider: {
    height: '1px',
    backgroundColor: '#E5E7EB',
    margin: `${spacing.small}px 0`,
  },
  garantiaTotal: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
  },
  garantiaTotalValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
  },
  commentLabel: {
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '4px',
  },
  commentText: {
    fontSize: '14px',
    color: '#1A1F24',
    lineHeight: '20px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#9CA3AF',
    textAlign: 'center',
    padding: `${spacing.medium}px 0`,
  },
  helpSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: `${spacing.large}px`,
  },
  helpTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
    marginBottom: '4px',
  },
  helpText: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: `${spacing.medium}px`,
  },
  helpButton: {
    backgroundColor: '#FFF0EE',
    padding: `16px ${spacing.medium}px`,
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: `${spacing.small}px`,
    width: '100%',
    border: 'none',
    cursor: 'pointer',
  },
  helpIcon: {
    width: '18px',
    height: '18px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  helpButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FF5136',
    marginLeft: '8px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #FF5136',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: `${spacing.large}px`,
  },
  errorText: {
    fontSize: '16px',
    color: '#6B7280',
    marginBottom: `${spacing.medium}px`,
  },
};
