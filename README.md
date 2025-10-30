# LogicTrack360

Sistema integral de gestión documental y Data Space compatible con IDSA/DSSC.

## 🌟 Características Principales

### Gestión Documental
- **Control de versiones** de documentos
- **Organización por roles** (Líder de Equipo, Desarrollo, Calidad)
- **Clasificación por fases** del proyecto
- **Sistema de categorías** flexible
- **Plantillas descargables** para uso inmediato

### Data Space IDSA/DSSC Compliant
- **📚 Catálogo de Datos** - Integración con OpenMetadata
- **📤 Publicación de Datos** - Comparte datasets de forma segura
- **📨 Gestión de Solicitudes** - Sistema de peticiones de acceso
- **📋 Contratos Implícitos** - Creación automática al aprobar solicitudes
- **🔄 Transferencias de Datos** - Seguimiento y control de intercambios

## 🚀 Inicio Rápido

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/yisus189/logictrack360.git
cd logictrack360

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales
# (ver SETUP_GUIDE.md para detalles)

# Iniciar en desarrollo
npm run dev
```

### Configuración de la Base de Datos

1. Crea un proyecto en Supabase
2. Ejecuta el script `database_schema.sql` en el editor SQL
3. Configura los buckets de almacenamiento
4. Actualiza las variables de entorno

Ver [SETUP_GUIDE.md](SETUP_GUIDE.md) para instrucciones detalladas.

## 📖 Documentación

- **[Data Space README](DATA_SPACE_README.md)** - Guía completa del Data Space
- **[Setup Guide](SETUP_GUIDE.md)** - Instrucciones de instalación
- **[Database Schema](database_schema.sql)** - Esquema de base de datos

## 🏗️ Arquitectura

### Stack Tecnológico

- **Frontend**: React 19, Vite
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **Catálogo de Datos**: OpenMetadata (opcional)
- **Estilos**: Tailwind CSS
- **Linting**: ESLint

### Componentes Principales

```
src/
├── components/
│   ├── DataSpace.jsx           # Componente principal del Data Space
│   ├── dataspace/
│   │   ├── DataCatalog.jsx     # Catálogo con OpenMetadata
│   │   ├── DataPublications.jsx # Publicación de datasets
│   │   ├── DataRequests.jsx    # Gestión de solicitudes
│   │   ├── DataContracts.jsx   # Contratos implícitos
│   │   └── DataTransfers.jsx   # Transferencias de datos
│   └── TemplatesPanel.jsx      # Panel de plantillas
├── lib/
│   ├── supabase.js             # Cliente Supabase
│   └── openmetadata.js         # Integración OpenMetadata
└── constants.js                # Constantes del sistema
```

## 🔐 Seguridad y Cumplimiento

### IDSA Compliance
- Soberanía de datos
- Control basado en contratos
- Auditoría completa
- Políticas de uso definidas

### Seguridad
- Row Level Security (RLS)
- Autenticación con Supabase
- Almacenamiento cifrado
- Control de acceso basado en roles

## 🛠️ Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Compilación
npm run build

# Vista previa de producción
npm run preview

# Linting
npm run lint
```

### Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: Amazing Feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📋 Roadmap

- [x] Sistema de gestión documental
- [x] Control de versiones
- [x] Panel de plantillas
- [x] Data Space IDSA/DSSC compliant
- [x] Integración con OpenMetadata
- [x] Sistema de solicitudes y contratos
- [x] Gestión de transferencias
- [ ] Tests automatizados
- [ ] API REST pública
- [ ] Marketplace de datos
- [ ] Análisis y reportes avanzados
- [ ] Integración con blockchain para contratos
- [ ] Federated learning support

## 📄 Licencia

Este proyecto está bajo licencia [especificar licencia].

## 👥 Equipo

Desarrollado por el equipo de LogicTrack360.

## 🆘 Soporte

Para reportar bugs o solicitar features, por favor abre un issue en GitHub.

---

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
