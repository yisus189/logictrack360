# Guía de Pruebas del Data Space

Esta guía te ayudará a probar y verificar que el Data Space funciona correctamente.

## Preparación Inicial

### 1. Configurar el Entorno

```bash
# 1. Copiar el archivo de configuración
cp .env.example .env

# 2. Editar .env con tus credenciales reales
nano .env
```

Configura al menos estas variables:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON=tu_clave_anonima
VITE_SUPABASE_BUCKET_DATA=data-space
```

### 2. Configurar Supabase

#### A. Ejecutar el Schema de Base de Datos

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. Navega a **SQL Editor**
3. Abre el archivo `database_schema.sql` de este proyecto
4. Copia todo el contenido y pégalo en el SQL Editor
5. Haz clic en **Run** para ejecutar el script

Esto creará todas las tablas necesarias:
- `data_catalog`
- `data_publications`
- `data_requests`
- `data_contracts`
- `data_transfers`
- `data_space_audit_log`

#### B. Crear los Storage Buckets

1. En Supabase, ve a **Storage**
2. Crea un nuevo bucket llamado `data-space`
3. Configura las políticas del bucket:

```sql
-- En SQL Editor, ejecuta:
-- Permitir lectura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'data-space');

-- Permitir subida a usuarios autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'data-space');
```

### 3. Instalar y Ejecutar

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

La aplicación estará disponible en: http://localhost:5173

---

## Plan de Pruebas Paso a Paso

### Prueba 1: Acceder al Data Space ✅

**Objetivo**: Verificar que el componente Data Space se carga correctamente

**Pasos**:
1. Abre http://localhost:5173
2. En el sidebar izquierdo, haz clic en el botón **📊 Datos**
3. Deberías ver la interfaz del Data Space con 5 pestañas:
   - 📚 Catálogo de Datos
   - 📤 Mis Publicaciones
   - 📨 Solicitudes
   - 📋 Contratos
   - 🔄 Transferencias

**Resultado Esperado**: 
- La interfaz se carga sin errores
- Puedes cambiar entre las pestañas
- El selector de rol funciona correctamente

---

### Prueba 2: Publicar un Dataset 📤

**Objetivo**: Crear una publicación de datos

**Pasos**:
1. Ve a la pestaña **📤 Mis Publicaciones**
2. Haz clic en **➕ Nueva Publicación**
3. Completa el formulario:
   - **Título**: "Dataset de Prueba Ventas 2024"
   - **Descripción**: "Datos de ventas mensuales para análisis"
   - **Categoría**: Structured Data
   - **Formato**: CSV
   - **Política de Uso**: Commercial Use
   - **Licencia**: CC-BY-4.0
   - **Archivo**: Crea un archivo CSV simple de prueba
4. Haz clic en **📤 Publicar Datos**

**Crear archivo de prueba CSV**:
```csv
mes,ventas,region
enero,15000,norte
febrero,18000,norte
marzo,22000,sur
```

**Resultado Esperado**:
- Mensaje: "✅ Datos publicados correctamente"
- El dataset aparece en la lista de publicaciones
- Puedes ver el estado "Active"

---

### Prueba 3: Ver el Catálogo 📚

**Objetivo**: Verificar que las publicaciones aparecen en el catálogo

**Pasos**:
1. Ve a la pestaña **📚 Catálogo de Datos**
2. Desmarca la opción **"Usar OpenMetadata"** (a menos que tengas OpenMetadata configurado)
3. Haz clic en **🔄 Recargar**

**Resultado Esperado**:
- Deberías ver tu publicación en el catálogo
- Puedes hacer clic en **👁️ Ver Detalles** para ver la información completa
- El botón **📨 Solicitar Acceso** está disponible

---

### Prueba 4: Solicitar Acceso a Datos 📨

**Objetivo**: Crear una solicitud de acceso

**Pasos**:
1. En el **📚 Catálogo de Datos**, selecciona tu dataset publicado
2. Haz clic en **📨 Solicitar Acceso**
3. Cambia tu rol en el selector superior a **"Data Consumer"**
4. Ve a la pestaña **📨 Solicitudes**
5. Haz clic en **📤 Enviadas**

**Resultado Esperado**:
- Mensaje: "✅ Solicitud de acceso enviada correctamente"
- La solicitud aparece en la lista de "Enviadas"
- Estado: "Pending"

---

### Prueba 5: Aprobar Solicitud y Crear Contrato 📋

**Objetivo**: Aprobar una solicitud y generar un contrato automático

**Pasos**:
1. Cambia tu rol a **"Data Provider"** (el rol original)
2. Ve a **📨 Solicitudes** → **📥 Recibidas**
3. Deberías ver la solicitud pendiente
4. Haz clic en **✅ Aprobar**

**Resultado Esperado**:
- Mensaje: "✅ Solicitud aprobada y contrato creado"
- La solicitud cambia a estado "Approved"
- Se crea automáticamente un contrato

---

### Prueba 6: Verificar Contrato Creado 📋

**Objetivo**: Ver el contrato generado automáticamente

**Pasos**:
1. Ve a la pestaña **📋 Contratos**
2. Deberías ver el contrato recién creado

**Resultado Esperado**:
- El contrato muestra:
  - Estado: "Active"
  - Proveedor: Data Provider
  - Consumidor: Data Consumer
  - Fecha de firma
  - Fecha de validez (1 año)
- Puedes ver los términos del contrato

---

### Prueba 7: Iniciar Transferencia 🔄

**Objetivo**: Crear y completar una transferencia de datos

**Pasos**:
1. En **📋 Contratos**, selecciona el contrato activo
2. Haz clic en **🔄 Iniciar Transferencia**
3. Ve a la pestaña **🔄 Transferencias**

**Resultado Esperado**:
- Mensaje: "✅ Transferencia iniciada"
- La transferencia aparece con estado "Pending" o "In Progress"
- Después de unos segundos, cambia a "Completed"

---

### Prueba 8: Descargar Datos 📥

**Objetivo**: Descargar los datos como consumidor

**Pasos**:
1. Cambia tu rol a **"Data Consumer"**
2. Ve a **🔄 Transferencias**
3. Encuentra la transferencia completada
4. Haz clic en **⬇️ Descargar Datos**

**Resultado Esperado**:
- Se abre una nueva pestaña con el archivo
- Puedes descargar el CSV que publicaste

---

## Pruebas con OpenMetadata (Opcional)

Si tienes OpenMetadata instalado y configurado:

### Configurar OpenMetadata

```bash
# Usando Docker
docker run -d -p 8585:8585 openmetadata/server:latest
```

**Pasos**:
1. Accede a http://localhost:8585
2. Credenciales por defecto: `admin` / `admin`
3. Agrega una fuente de datos (PostgreSQL, MySQL, etc.)
4. Genera un token JWT en Settings → Bots
5. Agrega el token a tu `.env`:
   ```env
   VITE_OPENMETADATA_URL=http://localhost:8585
   VITE_OPENMETADATA_TOKEN=tu_token_jwt
   ```

### Probar Integración

1. Reinicia la aplicación
2. Ve a **📚 Catálogo de Datos**
3. Marca **"Usar OpenMetadata"**
4. Deberías ver los datasets de OpenMetadata

---

## Verificación de Funcionalidad Completa

### Checklist de Pruebas

- [ ] ✅ Data Space se carga correctamente
- [ ] ✅ Puedes cambiar entre las 5 pestañas
- [ ] ✅ El selector de rol funciona
- [ ] ✅ Puedes publicar un dataset
- [ ] ✅ El dataset aparece en el catálogo
- [ ] ✅ Puedes solicitar acceso
- [ ] ✅ Las solicitudes enviadas se ven en "Enviadas"
- [ ] ✅ Las solicitudes recibidas se ven en "Recibidas"
- [ ] ✅ Puedes aprobar solicitudes
- [ ] ✅ Se crea un contrato automáticamente
- [ ] ✅ El contrato aparece en la pestaña Contratos
- [ ] ✅ Puedes iniciar una transferencia
- [ ] ✅ La transferencia progresa y se completa
- [ ] ✅ Puedes descargar los datos
- [ ] ✅ La búsqueda funciona en el catálogo
- [ ] ✅ Los filtros funcionan correctamente

---

## Solución de Problemas Comunes

### Error: "Error cargando archivos de datos"

**Causa**: Tablas no creadas en Supabase

**Solución**: 
1. Verifica que ejecutaste `database_schema.sql`
2. En Supabase SQL Editor, ejecuta:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'data_%';
   ```
3. Deberías ver las 6 tablas del Data Space

### Error: "No se pudo subir documento"

**Causa**: Bucket no configurado o sin permisos

**Solución**:
1. Verifica que el bucket `data-space` existe en Storage
2. Ejecuta las políticas de storage mencionadas arriba
3. Verifica que `VITE_SUPABASE_BUCKET_DATA=data-space` en `.env`

### Catálogo vacío

**Causa**: No hay publicaciones o problemas con RLS

**Solución**:
1. Crea al menos una publicación primero
2. Desmarca "Usar OpenMetadata" para ver datos locales
3. Verifica las políticas RLS en Supabase

### OpenMetadata no conecta

**Causa**: OpenMetadata no está ejecutándose o token inválido

**Solución**:
1. Verifica que OpenMetadata esté corriendo: `curl http://localhost:8585/api/v1/health`
2. Verifica el token JWT
3. Revisa la consola del navegador para más detalles

---

## Pruebas Avanzadas

### Prueba del Flujo Completo

Simula un escenario real end-to-end:

1. **Como Data Provider**:
   - Publica 3 datasets diferentes
   - Con diferentes políticas de uso
   - Algunos gratuitos, algunos de pago

2. **Como Data Consumer**:
   - Explora el catálogo
   - Solicita acceso a 2 datasets
   - Espera aprobación

3. **Como Data Provider**:
   - Revisa solicitudes
   - Aprueba una, rechaza otra

4. **Como Data Consumer**:
   - Verifica contratos creados
   - Descarga datos del contrato aprobado

5. **Verificación**:
   - Revisa la tabla de auditoría
   - Confirma que todas las acciones están registradas

---

## Scripts de Prueba SQL

Puedes verificar directamente en la base de datos:

```sql
-- Ver todas las publicaciones
SELECT id, title, category, status, published_at 
FROM data_publications 
ORDER BY published_at DESC;

-- Ver todas las solicitudes
SELECT id, request_type, status, requested_at 
FROM data_requests 
ORDER BY requested_at DESC;

-- Ver contratos activos
SELECT * FROM active_contracts_summary;

-- Ver estadísticas de solicitudes
SELECT * FROM request_statistics;

-- Ver transferencias recientes
SELECT id, status, initiated_at, completed_at 
FROM data_transfers 
ORDER BY initiated_at DESC;
```

---

## Capturas de Pantalla Esperadas

Cuando todo funciona correctamente, deberías ver:

1. **Catálogo**: Grid de cards con datasets
2. **Publicaciones**: Lista de tus datasets publicados
3. **Solicitudes**: Tabs de Enviadas/Recibidas con cards de solicitudes
4. **Contratos**: Cards de contratos con estado y acciones
5. **Transferencias**: Lista de transferencias con barras de progreso

---

## Siguiente Paso

Una vez que hayas completado todas las pruebas básicas, el Data Space está funcionando correctamente y listo para uso en producción (después de configurar autenticación real y personalizar las políticas según tus necesidades).

Para preguntas o problemas, revisa:
- `DATA_SPACE_README.md` - Documentación completa
- `SETUP_GUIDE.md` - Guía de configuración
- Console del navegador - Para errores de JavaScript
- Supabase Logs - Para errores de backend
