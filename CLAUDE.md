# cociname-chef-multiplatform — Guía para Claude

## Spec Driven Development

Los contratos del API viven en `../cociname-admin-api/specs/`.
**Antes de escribir cualquier llamada al API, leer la spec del módulo.**

Ruta de referencia: `C:\proyecto\cociname\ADM\cociname-admin-api\specs\`

Specs disponibles: `common.yaml`, `customer.yaml`, `chef.yaml`, `reservation.yaml`,
`reservation-diet.yaml`, `reservation-event.yaml`, `reservation-service-task.yaml`

## Propósito

App multiplataforma para cocineras de Cociname. Permite a las cocineras:
- Ver y gestionar sus reservas asignadas
- Ver los planes dietéticos de sus clientes
- Consultar y actualizar el estado de cada servicio
- Ver sus pagos y comisiones

Consume directamente `cociname-admin-api`.

## Campos del Chef en respuesta del API

Ver `../cociname-admin-api/specs/chef.yaml` para el naming completo.

- Autenticación: el token de sesión lo resuelve el servidor
- `firstName`, `lastName` — separados (NO `name`)
- `phoneNumber` — teléfono de contacto
- `coverageRadiusKm` — radio de cobertura (default 5km)

## Tipos de reserva que maneja una cocinera

| Tipo | Campo de asignación | Estado |
|---|---|---|
| Reservation | `ChefId` | `StatusReservation` |
| ReservationDiet | `ChefId` | `StatusDiet` |
| ReservationEvent | `ChefId` | `StatusEvent` |
| ReservationServiceTask | `chefId` | `statusReservation` |

## Convenciones de naming heredadas del API

Typos históricos que NO se corrigen (vienen del API y del modelo de BD):
- `PuchaseIngredients` (sin r)
- `PercentageCommision` (un solo 's')
- `Suscription` (sin c)
- `diner` (minúscula en algunos DTOs)

## API de destino
`../cociname-admin-api` — ver su CLAUDE.md y sus specs para contratos
