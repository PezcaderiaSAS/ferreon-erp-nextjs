# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- Plataforma: Alquileres System (Next.js 14 en Vercel + Supabase Postgres RLS).
- Dashboard & Calendario Operativo Multi-Flujo implementado: 4 KPIs en vivo (Flota, Contratos, Devoluciones, Cartera COP), layout 65/35, Calendario interactivo (Mes/Semana/Agenda), Drawer contextual con '+ Nuevo Alquiler', Tareas híbridas (sistema + manuales) y Feed de alertas.
- Pruebas automatizadas: 403/403 tests pasando (100%), 0 errores de TypeScript y compilación de producción exitosa (32/32 rutas).

## Decisiones (y por qué)
- **Centro de Mando Asimétrico 65/35**: Prioriza la superficie del calendario operativo en la columna principal mientras consolida tareas urgentes y recordatorios en el lateral derecho.
- **Drawer con '+ Nuevo Alquiler con fecha inicial'**: Agiliza la conversión operativa directa precargando `?fechaInicio=YYYY-MM-DD` en el wizard de alquileres al interactuar con cualquier día.

## Aprendizajes y errores a evitar
- Jamás usar librerías externas de calendario pesadas que introduzcan dependencias obsoletas; un componente nativo React optimizado garantiza 60 fps y un First Load de apenas 109 kB.
- No mutar objetos de tareas ni usar índices mágicos en cálculos monetarios; operar siempre en enteros COP.

## Próximos pasos
- Siguiente hito funcional: Automatización CI/CD de Paridad de Tokens o portal de autoservicio de clientes.
