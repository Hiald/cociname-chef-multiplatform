import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { appScreenTheme as theme, mockup } from '../styles';
import { apiService } from '../services/api.service';
import { CatalogRecipeSheet } from '../components/catalog-recipe-sheet';
import { RecipeReport } from '../components/recipe-report';

const PAGE_SIZE = 15;

/** Cuántos números de página se muestran a la vez. */
const PAGE_WINDOW = 3;

/**
 * Tipos de plato. Se usan las etiquetas del admin (Food/Control.cshtml), que es
 * donde el staff guarda el campo Menu.TypeFood y por tanto la fuente de verdad.
 */
const FOOD_TYPES = [
  { value: 0, label: 'Todas las categorías' },
  { value: 1, label: 'Guisos' },
  { value: 2, label: 'Pastas' },
  { value: 3, label: 'Sopas' },
  { value: 4, label: 'Menestra' },
  { value: 5, label: 'Ensalada' },
  { value: 6, label: 'Arroz' },
];

const SORT_OPTIONS = [
  { value: 'az', label: 'Nombre (A–Z)' },
  { value: 'za', label: 'Nombre (Z–A)' },
];

const TILE_BACKGROUNDS = [
  'linear-gradient(135deg,#FFF3D6,#FFE0A0)',
  'linear-gradient(135deg,#FFE7DD,#FFC0A8)',
  'linear-gradient(135deg,#E4F6EC,#BEE9CF)',
  'linear-gradient(135deg,#E7EEFA,#C6DBF6)',
  'linear-gradient(135deg,#F0EBFB,#DDD0F5)',
];

const getTypeLabel = (typeFood) => {
  const match = FOOD_TYPES.find((item) => item.value === Number(typeFood || 0));
  return match && match.value > 0 ? match.label : null;
};

const CatalogScreen = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [search, setSearch] = useState('');
  const [typeFood, setTypeFood] = useState(0);
  const [sort, setSort] = useState('az');
  const [page, setPage] = useState(1);

  // Versiones (MasterRecipe) por plato, cacheadas al abrir el selector
  const [versionsByMenu, setVersionsByMenu] = useState({});

  // Platos cuya imagen no cargó; se les muestra el emoji de respaldo.
  const [brokenImages, setBrokenImages] = useState({});

  // Plato abierto en el sheet + versión elegida
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const loadMenus = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Se traen todos y se filtra/pagina en memoria: el catálogo es acotado y
      // así la búsqueda por ingrediente/nombre responde sin ir al servidor.
      const response = await apiService.getMenuCatalog({ recordsPerPage: 300 });

      if (!response.success) {
        throw new Error(response.errorMessage || 'No se pudo cargar el catálogo.');
      }

      setMenus(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading menu catalog:', error);
      setMenus([]);
      setErrorMessage(error?.message || 'No se pudo cargar el catálogo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = menus.filter((menu) => {
      if (typeFood > 0 && Number(menu?.typeFood || 0) !== typeFood) return false;
      if (!term) return true;

      const haystack = [menu?.name, menu?.description, menu?.tags, getTypeLabel(menu?.typeFood)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });

    return result.sort((a, b) => {
      const comparison = String(a?.name || '').localeCompare(String(b?.name || ''), 'es');
      return sort === 'za' ? -comparison : comparison;
    });
  }, [menus, search, typeFood, sort]);

  // Si el filtro deja menos páginas que la actual, se vuelve al inicio.
  useEffect(() => {
    setPage(1);
  }, [search, typeFood, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  // Ventana de 3 números: la actual y las dos siguientes. Al acercarse al final
  // se corre hacia atrás para seguir mostrando 3 (ej. con 10 páginas: 8 9 10).
  const pageNumbers = useMemo(() => {
    let first = currentPage;
    let last = Math.min(totalPages, first + PAGE_WINDOW - 1);

    if (last - first + 1 < PAGE_WINDOW) {
      first = Math.max(1, last - PAGE_WINDOW + 1);
    }

    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  }, [currentPage, totalPages]);

  /** Trae las versiones del plato una sola vez y las cachea. */
  const ensureVersions = useCallback(async (menuId) => {
    if (versionsByMenu[menuId]) return versionsByMenu[menuId];

    try {
      const response = await apiService.getMasterRecipesByMenuId(menuId);
      const versions = response.success && Array.isArray(response.data) ? response.data : [];
      setVersionsByMenu((prev) => ({ ...prev, [menuId]: versions }));
      return versions;
    } catch (error) {
      console.error('Error loading recipe versions:', error);
      setVersionsByMenu((prev) => ({ ...prev, [menuId]: [] }));
      return [];
    }
  }, [versionsByMenu]);

  /** Al desplegar el selector se cargan las versiones para poder listarlas. */
  const handleOpenVersionSelect = (menuId) => {
    if (!versionsByMenu[menuId]) void ensureVersions(menuId);
  };

  const openMenuSheet = async (menu, versionId = null) => {
    const menuId = Number(menu?.id || 0);
    if (!menuId) return;

    const versions = await ensureVersions(menuId);
    const chosen = versionId || (versions.length > 0 ? Number(versions[0].id) : null);

    setActiveMenu({
      ...menu,
      typeLabel: getTypeLabel(menu.typeFood),
      tileBg: TILE_BACKGROUNDS[menuId % TILE_BACKGROUNDS.length],
    });
    setActiveVersionId(chosen);
  };

  const closeSheet = () => {
    setActiveMenu(null);
    setActiveVersionId(null);
    setReportOpen(false);
  };

  const activeVersions = activeMenu ? (versionsByMenu[Number(activeMenu.id)] || []) : [];
  const activeVersion = activeVersions.find((v) => Number(v.id) === Number(activeVersionId));

  return (
    <div className="coci-page-wrap">
      <h1 style={{ ...mockup.screenTitle, marginBottom: 4 }}>Catálogo de platos</h1>
      <p style={{ ...mockup.screenSubtitle, marginBottom: 18 }}>
        Los platos de Cociname con sus versiones, ingredientes y recetas.
      </p>

      <div style={styles.searchWrap}>
        <span style={styles.searchIcon}>🔎</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar plato o ingrediente..."
          style={styles.searchInput}
        />
      </div>

      <div style={styles.filtersRow}>
        <select
          value={typeFood}
          onChange={(event) => setTypeFood(Number(event.target.value))}
          style={styles.select}
        >
          {FOOD_TYPES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          style={styles.select}
        >
          {SORT_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={styles.stateCard}>Cargando platos...</div>
      ) : errorMessage ? (
        <div style={styles.stateCard}>
          <div style={{ marginBottom: 12 }}>{errorMessage}</div>
          <button type="button" style={styles.retryButton} onClick={() => void loadMenus()}>
            Reintentar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.stateCard}>No encontramos platos con esos filtros.</div>
      ) : (
        <>
          <div style={styles.counter}>
            Mostrando {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)} de {filtered.length} platos
          </div>

          <div style={styles.grid}>
            {visible.map((menu, index) => {
              const menuId = Number(menu.id);
              const versions = versionsByMenu[menuId];
              const typeLabel = getTypeLabel(menu.typeFood);
              const image = menu.image1 || menu.image2 || menu.image3;

              return (
                <div key={menuId} style={styles.card}>
                  <div
                    style={{ ...styles.thumb, background: TILE_BACKGROUNDS[index % TILE_BACKGROUNDS.length] }}
                    onClick={() => void openMenuSheet(menu)}
                  >
                    {image && !brokenImages[menuId] ? (
                      // Si la URL guardada ya no existe, se cae al emoji en vez de
                      // mostrar el ícono de imagen rota con el alt encima.
                      <img
                        src={image}
                        alt={menu.name}
                        style={styles.thumbImage}
                        onError={() => setBrokenImages((prev) => ({ ...prev, [menuId]: true }))}
                      />
                    ) : (
                      <span style={styles.thumbEmoji}>🍲</span>
                    )}
                    {typeLabel && <span style={styles.typeBadge}>{typeLabel}</span>}
                  </div>

                  <div style={styles.cardName} onClick={() => void openMenuSheet(menu)}>
                    {menu.name}
                  </div>

                  {/* Selector de versión: elegir una abre la receta directamente. */}
                  <div style={styles.versionSelectWrap}>
                    <select
                      value=""
                      style={styles.versionSelect}
                      onMouseDown={() => handleOpenVersionSelect(menuId)}
                      onFocus={() => handleOpenVersionSelect(menuId)}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (value) void openMenuSheet(menu, value);
                      }}
                    >
                      {/* Placeholder del botón cerrado; hidden+disabled para que no
                          aparezca como opción al abrir el dropdown. */}
                      <option value="" disabled hidden>Ver receta</option>
                      {(versions || []).map((version) => (
                        <option key={version.id} value={version.id}>{version.title}</option>
                      ))}
                    </select>
                    <span style={styles.versionChevron}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C2492A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                type="button"
                style={{ ...styles.pageArrow, ...(currentPage === 1 ? styles.pageArrowDisabled : {}) }}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="Página anterior"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  style={{
                    ...styles.pageNumber,
                    ...(pageNumber === currentPage ? styles.pageNumberActive : {}),
                  }}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                style={{ ...styles.pageArrow, ...(currentPage === totalPages ? styles.pageArrowDisabled : {}) }}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      <CatalogRecipeSheet
        visible={Boolean(activeMenu)}
        onClose={closeSheet}
        menu={activeMenu}
        versions={activeVersions}
        selectedVersionId={activeVersionId}
        onVersionChange={setActiveVersionId}
        onReport={() => setReportOpen(true)}
      />

      <RecipeReport
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        masterRecipeId={activeVersionId}
        menuId={activeMenu ? Number(activeMenu.id) : 0}
        recipeName={activeMenu && activeVersion
          ? `${activeMenu.name} - ${activeVersion.title}`
          : activeMenu?.name}
      />
    </div>
  );
};

const styles = {
  searchWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 14,
    opacity: 0.6,
  },
  searchInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '13px 14px 13px 40px',
    borderRadius: 14,
    border: '1.5px solid #EDE6DD',
    background: '#fff',
    fontFamily: theme.fontBody,
    fontSize: 14,
    color: theme.textPrimary,
    outline: 'none',
  },
  filtersRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 14,
  },
  select: {
    flex: 1,
    minWidth: 0,
    padding: '11px 12px',
    borderRadius: 14,
    border: '1.5px solid #EDE6DD',
    background: '#fff',
    fontFamily: theme.fontBody,
    fontSize: 13.5,
    color: theme.textPrimary,
    outline: 'none',
    cursor: 'pointer',
  },
  counter: {
    fontSize: 12.5,
    color: theme.textMuted,
    marginBottom: 12,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 12,
  },
  card: {
    background: theme.cardBg,
    borderRadius: 18,
    boxShadow: theme.cardShadow,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  thumb: {
    position: 'relative',
    borderRadius: 14,
    height: 96,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbEmoji: {
    fontSize: 34,
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    background: 'rgba(255,255,255,.92)',
    color: '#8A5A2B',
    borderRadius: 999,
    padding: '3px 9px',
    fontSize: 10.5,
    fontWeight: 700,
    fontFamily: theme.fontHeading,
  },
  cardName: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 13.5,
    color: theme.textPrimary,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  versionSelectWrap: {
    position: 'relative',
    marginTop: 'auto',
  },
  versionSelect: {
    width: '100%',
    appearance: 'none',
    WebkitAppearance: 'none',
    background: '#FFF3EF',
    border: '1.5px solid #F7D9CD',
    borderRadius: 11,
    padding: '9px 28px 9px 10px',
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 11.5,
    color: '#C2492A',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  versionChevron: {
    position: 'absolute',
    right: 9,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    display: 'flex',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  pageArrow: {
    width: 36,
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    background: '#fff',
    border: '1.5px solid #EDE6DD',
    color: '#5B6577',
    cursor: 'pointer',
    padding: 0,
    boxSizing: 'border-box',
  },
  pageArrowDisabled: {
    color: '#D3D8E0',
    cursor: 'not-allowed',
  },
  pageNumber: {
    minWidth: 36,
    height: 36,
    padding: '0 10px',
    borderRadius: 11,
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 13.5,
    cursor: 'pointer',
    background: '#fff',
    border: '1.5px solid #EDE6DD',
    color: '#5B6577',
    boxSizing: 'border-box',
  },
  pageNumberActive: {
    background: '#F2542D',
    border: '1.5px solid #F2542D',
    color: '#fff',
    boxShadow: '0 4px 10px rgba(242,84,45,.24)',
  },
  stateCard: {
    background: theme.cardBg,
    boxShadow: theme.cardShadow,
    borderRadius: 18,
    padding: '26px 20px',
    textAlign: 'center',
    fontSize: 14,
    color: theme.textSecondary,
  },
  retryButton: {
    padding: '10px 22px',
    borderRadius: 12,
    border: 'none',
    background: theme.primaryGradient,
    color: '#fff',
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 13.5,
    cursor: 'pointer',
    boxShadow: theme.primaryShadow,
  },
};

export default CatalogScreen;
