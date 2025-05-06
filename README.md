# ULTEC App v2 - Sistema de Gestión Académica

Sistema de gestión integral para academias educativas, desarrollado con React, TypeScript y TailwindCSS.

## 🚀 Características

- **Gestión de Alumnos**
  - Registro y seguimiento de estudiantes
  - Historial académico
  - Gestión de asistencias

- **Gestión de Cursos**
  - Creación y administración de cursos
  - Asignación de profesores
  - Control de horarios

- **Sistema de Pagos**
  - Registro de pagos
  - Generación de recibos
  - Reportes financieros
  - Seguimiento de pagos pendientes

- **Gestión de Encargados**
  - Registro de encargados
  - Asociación con alumnos
  - Comunicación y notificaciones

- **Evaluaciones y Calificaciones**
  - Registro de evaluaciones
  - Cálculo de promedios
  - Reportes de rendimiento

- **Dashboard Administrativo**
  - Estadísticas generales
  - Reportes financieros
  - Indicadores de rendimiento

## 🛠️ Tecnologías Utilizadas

- **Frontend**
  - React 18
  - TypeScript
  - TailwindCSS 4
  - Vite
  - React Router DOM
  - React Icons

- **Backend**
  - Supabase (Backend as a Service)
  - PostgreSQL (Base de datos)

- **Herramientas de Desarrollo**
  - ESLint
  - Prettier
  - Git

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- npm o yarn
- Cuenta en Supabase

## 🔧 Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/sdark12/ultec-app-v2.git
   cd ultec-app-v2
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

## 📦 Estructura del Proyecto

```
ultec-app-v2/
├── src/
│   ├── components/     # Componentes React
│   ├── pages/         # Páginas de la aplicación
│   ├── routes/        # Configuración de rutas
│   ├── context/       # Contextos de React
│   ├── types/         # Definiciones de TypeScript
│   └── lib/           # Utilidades y configuraciones
├── public/            # Archivos estáticos
└── ...
```

## 🔐 Roles y Permisos

El sistema maneja diferentes roles de usuario:
- **Administrador**: Acceso total al sistema
- **Profesor**: Gestión de cursos y calificaciones
- **Encargado**: Visualización de información de sus alumnos
- **Alumno**: Acceso a su información personal y académica

## 📱 Características Responsivas

- Diseño adaptable a diferentes dispositivos
- Interfaz optimizada para móviles y tablets
- Componentes responsivos con TailwindCSS

## 🤝 Contribución

1. Haz un Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## ✨ Características Futuras

- [ ] Sistema de notificaciones por email
- [ ] Aplicación móvil
- [ ] Integración con sistemas de pago en línea
- [ ] Módulo de videoconferencias
- [ ] Sistema de tareas y deberes

## 📞 Soporte

Para soporte, por favor contacta a:
- Email: darksmetal@gmail.com
- GitHub: [@sdark12](https://github.com/sdark12)

---

Desarrollado con ❤️ por [sdark12](https://github.com/sdark12)
