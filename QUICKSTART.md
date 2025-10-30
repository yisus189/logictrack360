# 🚀 Inicio Rápido - Data Space

Esta guía te permite tener el Data Space funcionando en tu computadora en **5 minutos**.

## Requisitos Previos

- Node.js 18+ instalado
- Cuenta en Supabase (gratis en https://supabase.com)
- Git instalado

## Paso 1: Clonar el Repositorio

```bash
# Clona el repositorio
git clone https://github.com/yisus189/logictrack360.git
cd logictrack360

# Cambia a la rama del Data Space
git checkout copilot/create-data-space
```

## Paso 2: Configurar Supabase (3 minutos)

### A. Crear Proyecto en Supabase

1. Ve a https://app.supabase.com
2. Crea una cuenta o inicia sesión
3. Clic en "New Project"
4. Completa:
   - **Name**: LogicTrack360
   - **Database Password**: (guarda esta contraseña)
   - **Region**: Elige el más cercano
5. Espera 2 minutos a que se cree el proyecto

### B. Configurar Base de Datos

1. En tu proyecto Supabase, ve a **SQL Editor** (icono de base de datos en el menú lateral)
2. Haz clic en **"New Query"**
3. Abre el archivo `database_schema.sql` de este repositorio
4. Copia TODO el contenido y pégalo en el SQL Editor de Supabase
5. Haz clic en **"Run"** (botón verde abajo a la derecha)
6. Deberías ver: "Success. No rows returned"

### C. Crear Bucket de Almacenamiento

1. En Supabase, ve a **Storage** (icono de carpeta en el menú lateral)
2. Haz clic en **"Create a new bucket"**
3. Nombre: `data-space`
4. Marca como **Public bucket**: ✅
5. Haz clic en **"Create bucket"**

### D. Obtener Credenciales

1. En Supabase, ve a **Project Settings** (icono de engranaje)
2. Ve a **API**
3. Copia:
   - **Project URL** (algo como: https://xxxxx.supabase.co)
   - **anon/public key** (una clave larga que empieza con "eyJ...")

## Paso 3: Configurar Variables de Entorno

```bash
# En la carpeta del proyecto
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON=tu_clave_anon_aqui
VITE_SUPABASE_BUCKET_DATA=data-space
```

**Reemplaza** los valores con los que copiaste de Supabase.

## Paso 4: Instalar y Ejecutar

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

¡Listo! Abre tu navegador en: **http://localhost:5173**

## Paso 5: Probar el Data Space

1. En la aplicación, haz clic en **"📊 Datos"** en el sidebar izquierdo
2. Deberías ver la interfaz del Data Space con 5 pestañas

### Prueba Rápida (2 minutos)

1. Ve a **"📤 Mis Publicaciones"**
2. Haz clic en **"➕ Nueva Publicación"**
3. Completa:
   - **Título**: "Mi Primera Prueba"
   - **Descripción**: "Dataset de prueba"
   - **Categoría**: Structured Data
   - **Formato**: CSV
   - **Política**: Commercial Use
4. En **"Archivo de datos"**, selecciona `test-data/ventas-2024.csv`
5. Haz clic en **"📤 Publicar Datos"**
6. ✅ Deberías ver: "Datos publicados correctamente"

**¡Felicidades!** El Data Space está funcionando. 🎉

## Flujo Completo de Prueba

Para probar todas las funcionalidades:

### 1. Publicar Dataset
- Ya lo hiciste arriba ✅

### 2. Ver en el Catálogo
- Ve a **"📚 Catálogo de Datos"**
- Desmarca **"Usar OpenMetadata"**
- Deberías ver tu publicación

### 3. Solicitar Acceso
- En el catálogo, haz clic en **"📨 Solicitar Acceso"**
- Cambia el rol a **"Data Consumer"** (arriba)
- Ve a **"📨 Solicitudes"** → **"📤 Enviadas"**
- Deberías ver tu solicitud

### 4. Aprobar Solicitud
- Cambia el rol a **"Data Provider"**
- Ve a **"📨 Solicitudes"** → **"📥 Recibidas"**
- Haz clic en **"✅ Aprobar"**
- Se crea un contrato automáticamente

### 5. Ver Contrato
- Ve a **"📋 Contratos"**
- Verás el contrato creado con estado "Active"

### 6. Transferir Datos
- En **"📋 Contratos"**, haz clic en **"🔄 Iniciar Transferencia"**
- Ve a **"🔄 Transferencias"**
- Espera unos segundos a que se complete

### 7. Descargar
- Cambia el rol a **"Data Consumer"**
- En **"🔄 Transferencias"**, haz clic en **"⬇️ Descargar Datos"**
- ✅ Se descarga tu archivo CSV

## Solución de Problemas

### "Error cargando documentos"
**Solución**: Verifica que ejecutaste el `database_schema.sql` en Supabase

### "No se pudo subir documento"
**Solución**: Verifica que creaste el bucket `data-space` en Supabase Storage

### El catálogo está vacío
**Solución**: 
1. Asegúrate de desmarcar "Usar OpenMetadata"
2. Publica al menos un dataset primero

## Verificar que Todo Funciona

Ejecuta este comando en Supabase SQL Editor para verificar:

```sql
-- Deberías ver 6 tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'data_%';
```

## Documentación Completa

- **TESTING_GUIDE.md** - Guía detallada de pruebas con 8 escenarios
- **DATA_SPACE_README.md** - Documentación completa del Data Space
- **SETUP_GUIDE.md** - Configuración avanzada y OpenMetadata

## Comandos Útiles

```bash
# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Verificar código
npm run lint

# Script de verificación rápida
./test-dataspace.sh
```

## ¿Necesitas Ayuda?

1. Revisa **TESTING_GUIDE.md** para más detalles
2. Verifica la consola del navegador (F12) para errores
3. Verifica los logs de Supabase en tu proyecto

---

**Tiempo total de configuración**: ~5 minutos
**¡Disfruta tu Data Space!** 🚀
