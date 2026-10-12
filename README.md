# Juntadita 🥩⚽🍻♠️

Calculadora offline y local-first para juntadas argentinas (asados, partidos de fútbol, picadas, truco y salidas). Diseñada específicamente para el organizador: carga de gastos con múltiples aportantes por compra, cálculo financiero estricto con redondeo entero en pesos argentinos ($ ARS), y generación inmediata del mensaje de liquidación listo para copiar y enviar al grupo de WhatsApp con alias bancario.

## Estado del Proyecto
**Versión 1.0 — 100% Funcional y Local-First.**
- Sin cuentas, sin contraseñas, sin base de datos en la nube y sin tracking.
- Persistencia total en `localStorage` con respaldo y restauración mediante archivos JSON descargables.
- Progressive Web App (PWA) instalable con soporte offline completo mediante Service Worker.

## Requisitos
- Node.js 18.0 o superior
- npm 9.0 o superior

## Comandos Disponibles

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo local
npm run dev

# Ejecutar suite de pruebas unitarias (Vitest)
npm test

# Compilar para producción (TypeScript + Vite)
npm run build

# Previsualizar el bundle de producción localmente
npm run preview
```

## Estructura del Proyecto

```text
juntadita/
├── public/                 # Favicon, íconos PWA y assets estáticos
├── src/
│   ├── core/               # Motor de cálculo puro y dominio
│   │   ├── balance.ts      # Algoritmo de liquidación y redondeo ($ ARS)
│   │   ├── whatsapp.ts     # Generador del mensaje plano de WhatsApp
│   │   ├── storage.ts      # Persistencia local y validación de esquemas
│   │   ├── rules.ts        # Reglas de negocio para borrado seguro
│   │   ├── security.ts     # Generador de UUIDs con fallback para red local
│   │   └── types.ts        # Interfaces y tipos del dominio
│   ├── hooks/
│   │   └── useJuntada.ts   # Hook principal de estado y persistencia reactiva
│   ├── styles/
│   │   └── index.css       # Sistema de diseño dark mode exclusivo
│   └── ui/
│       ├── components/     # Componentes reutilizables (Button, Input, Modal, Chip, TabBar, Header, FAB)
│       ├── forms/          # Formularios (CrearJuntada, CargarGasto)
│       ├── modules/        # Módulos opcionales (FutbolModulo, TrucoModulo)
│       └── views/          # Vistas principales (PersonasView, GastosView, ResumenView)
├── vite.config.ts          # Configuración de Vite, Vitest y VitePWA
└── tsconfig.json           # Configuración de TypeScript
```

## Despliegue en la Nube

Al ser una aplicación 100% estática y del lado del cliente (SPA/PWA), se puede desplegar gratuitamente en cualquier proveedor de hosting estático:

### Vercel
1. Ingresá en [vercel.com](https://vercel.com/) y conectá tu repositorio de Git.
2. Parámetros de compilación:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Hacé click en **Deploy**.

### Cloudflare Pages
1. Ingresá en tu panel de Cloudflare y seleccioná **Workers & Pages** → **Create application** → **Pages**.
2. Conectá el repositorio y configurá:
   - **Framework preset:** None / Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Hacé click en **Save and Deploy**.

## Instalación como PWA

Juntadita funciona como una aplicación nativa en dispositivos móviles y de escritorio:

- **En Android (Chrome / Brave / Edge):**
  Al ingresar al sitio, tocá el menú de tres puntos del navegador y seleccioná **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.
- **En iOS (Safari):**
  Tocá el botón de compartir (el cuadrado con la flecha hacia arriba) y elegí **"Agregar al inicio"** (*Add to Home Screen*).
- **Modo Offline:**
  Una vez abierta por primera vez, la aplicación se almacena en caché y puede abrirse y utilizarse completamente sin conexión a internet ni cobertura móvil.

## Licencia

Distribuido bajo licencia MIT. Hecho para simplificar las juntadas entre amigos.
