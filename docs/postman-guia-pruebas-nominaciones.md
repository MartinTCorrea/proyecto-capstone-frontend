# SGAOB — Guía de Pruebas con Postman y cURL
## Módulo 4: Nominaciones y Asignaciones (PR11)
**Sistema de Gestión de Árbitros y Oficiales de Básquetbol**  
**Proyecto Capstone — Duoc UC**  

Esta guía proporciona las instrucciones detalladas, endpoints, tokens de prueba y casos de prueba para validar la lógica del Módulo 4 utilizando **Postman**, **Thunder Client** o **cURL**.

---

### 1. Configuración Inicial y Tokens de Acceso

El backend expone el endpoint local `POST /api/auth/dev-token` para generar tokens JWT válidos de prueba para cada rol del sistema.

#### 1.1 Obtener Token de Comisión Técnica (Administrador)
```bash
curl -X POST http://localhost:3000/api/auth/dev-token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ct.postman@sgaob.cl",
    "firstName": "Admin",
    "lastName": "ComisionTecnica",
    "roles": ["ADMIN_COMISION_TECNICA"]
  }'
```
> Copia el valor de `accessToken` devuelto. En adelante se referenciará como `{{TOKEN_CT}}`.

#### 1.2 Obtener Token de Árbitro
```bash
curl -X POST http://localhost:3000/api/auth/dev-token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "arbitro.postman@sgaob.cl",
    "firstName": "Carlos",
    "lastName": "Arbitro",
    "roles": ["ARBITRO"]
  }'
```
> En adelante: `{{TOKEN_ARBITRO}}` y `{{ID_ARBITRO}}`.

#### 1.3 Obtener Token de Oficial de Mesa
```bash
curl -X POST http://localhost:3000/api/auth/dev-token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mesa.postman@sgaob.cl",
    "firstName": "Carolina",
    "lastName": "OficialMesa",
    "roles": ["OFICIAL_MESA"]
  }'
```
> En adelante: `{{TOKEN_MESA}}` y `{{ID_MESA}}`.

---

### 2. Catálogo de Endpoints del Módulo de Nominaciones

Base URL: `http://localhost:3000/api`  
Documentación Swagger interactiva: `http://localhost:3000/api/docs`

| Método | Endpoint | Roles Permitidos | Descripción |
|---|---|---|---|
| `GET` | `/nominations/available-candidates` | CT | Cruce de candidatos disponibles por partido y slot (CU-07). |
| `GET` | `/nominations` | CT, Árbitro, Mesa | Listado de nominaciones con filtros por partido o estado. |
| `GET` | `/nominations/:id` | CT, Árbitro, Mesa | Detalle de la nominación y datos del partido. |
| `POST` | `/nominations` | CT | Asignar personal con validación dura de rol y disponibilidad. |
| `PATCH` | `/nominations/:id/respond` | Árbitro nominado, CT | Responder nominación (CONFIRMED o REJECTED con motivo). |
| `DELETE` | `/nominations/:id` | CT | Revocar designación liberando el slot para reasignación. |

---

### 3. Escenarios de Prueba Paso a Paso (Casos de Uso)

#### Escenario 1: Consultar Candidatos Aptos para un Slot (CU-07, Paso 2)
Permite a la Comisión Técnica ver la lista de personal disponible para un partido específico:
```bash
curl -X GET "http://localhost:3000/api/nominations/available-candidates?matchId={{MATCH_ID}}&matchRole=ARBITRO_PRINCIPAL" \
  -H "Authorization: Bearer {{TOKEN_CT}}"
```
**Respuesta esperada (200 OK):**
```json
{
  "requestedSlot": "ARBITRO_PRINCIPAL",
  "requiredSystemRole": "ARBITRO",
  "counts": {
    "available": 2,
    "unavailable": 1,
    "total": 3
  },
  "availableCandidates": [
    {
      "id": "{{ID_ARBITRO}}",
      "firstName": "Carlos",
      "lastName": "Arbitro",
      "declaredBlock": "FULL",
      "isAvailable": true,
      "hasConflict": false
    }
  ],
  "unavailableCandidates": [ ... ]
}
```

---

#### Escenario 2: Prueba de Validación Dura de Roles (Anexo A.1)
Intentar nominar a un usuario que tiene el rol `OFICIAL_MESA` para el slot `ARBITRO_PRINCIPAL`:
```bash
curl -X POST http://localhost:3000/api/nominations \
  -H "Authorization: Bearer {{TOKEN_CT}}" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "{{MATCH_ID}}",
    "userId": "{{ID_MESA}}",
    "matchRole": "ARBITRO_PRINCIPAL"
  }'
```
**Respuesta esperada (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Validación de rol fallida (Anexo A.1): Para ser nominado a ARBITRO_PRINCIPAL, el usuario DEBE tener la acreditación de Árbitro de campo (ARBITRO)."
}
```

---

#### Escenario 3: Prueba de Cruce de Disponibilidad (RF12)
Intentar nominar a un árbitro que no declaró disponibilidad para el bloque horario del partido:
```bash
curl -X POST http://localhost:3000/api/nominations \
  -H "Authorization: Bearer {{TOKEN_CT}}" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "{{MATCH_ID}}",
    "userId": "{{ID_ARBITRO_SIN_DISPONIBILIDAD}}",
    "matchRole": "ARBITRO_PRINCIPAL"
  }'
```
**Respuesta esperada (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "El usuario no tiene disponibilidad declarada para este bloque horario (RF12)..."
}
```

---

#### Escenario 4: Asignación Exitosa con Despacho de Correo (RF11, RF14)
Asignar al árbitro disponible al slot correspondiente:
```bash
curl -X POST http://localhost:3000/api/nominations \
  -H "Authorization: Bearer {{TOKEN_CT}}" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "{{MATCH_ID}}",
    "userId": "{{ID_ARBITRO}}",
    "matchRole": "ARBITRO_PRINCIPAL"
  }'
```
**Respuesta esperada (201 Created):**
```json
{
  "id": "{{NOMINATION_ID}}",
  "matchId": "{{MATCH_ID}}",
  "userId": "{{ID_ARBITRO}}",
  "matchRole": "ARBITRO_PRINCIPAL",
  "status": "PENDING",
  "notifiedAt": "2026-09-27T21:05:00.000Z",
  "user": {
    "firstName": "Carlos",
    "lastName": "Arbitro",
    "email": "arbitro.postman@sgaob.cl"
  }
}
```

---

#### Escenario 5: Rechazo de Duplicidad de Slot y Usuario
1. Intentar asignar a otro usuario al mismo slot `ARBITRO_PRINCIPAL` ya ocupado:
   **Respuesta esperada:** `409 Conflict` ("El slot ARBITRO_PRINCIPAL ya se encuentra asignado en este partido").
2. Intentar asignar al mismo usuario `{{ID_ARBITRO}}` como `ARBITRO_1` en el mismo partido:
   **Respuesta esperada:** `409 Conflict` ("El usuario seleccionado ya posee un rol asignado en este mismo partido").

---

#### Escenario 6: Árbitro Responde a su Nominación (RF15)
El árbitro autenticado confirma su designación:
```bash
curl -X PATCH http://localhost:3000/api/nominations/{{NOMINATION_ID}}/respond \
  -H "Authorization: Bearer {{TOKEN_ARBITRO}}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONFIRMED"
  }'
```
O bien, si la rechaza:
```bash
curl -X PATCH http://localhost:3000/api/nominations/{{NOMINATION_ID}}/respond \
  -H "Authorization: Bearer {{TOKEN_ARBITRO}}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "rejectionReason": "Imposibilidad de traslado por viaje de trabajo"
  }'
```

---

#### Escenario 7: Revocación por Comisión Técnica
La Comisión Técnica revoca la asignación liberando el slot:
```bash
curl -X DELETE http://localhost:3000/api/nominations/{{NOMINATION_ID}} \
  -H "Authorization: Bearer {{TOKEN_CT}}"
```
**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "message": "Nominación revocada exitosamente"
}
```
