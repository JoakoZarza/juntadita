# Checklist UX — Juntadita

Prioridad: **P0** = se nota/rompe confianza · **P1** = pulido de producto · **P2** = detalle fino

## 1. Estados de carga

- [ ] **P1** Reemplazar el texto plano "Iniciando Juntadita..." (`src/App.tsx:81`) por un splash con logo o un skeleton del header + tabs. Hoy la carga es instantánea (localStorage) y produce un flash de texto que se ve "a medio hacer".
- [ ] **P1** Importar backup (`CrearJuntada.tsx`, `ResumenView.tsx`): mostrar estado "Importando…" y deshabilitar los botones mientras se lee el archivo. Hoy no hay feedback y se puede tocar dos veces.
- [ ] **P2** Exportar backup: feedback de "Backup descargado ✓" (hoy el botón no responde visualmente).
- [ ] **P2** Transición suave al cambiar de tab y al abrir/cerrar `CargarGasto` y los módulos (hoy aparecen/desaparecen de golpe).

## 2. Estados vacíos

- [x] **P0** Onboarding en `CrearJuntada`: el usuario nuevo cae directo en un formulario sin saber qué hace la app. Sumar 1 línea de propuesta de valor ("Dividí los gastos de la juntada y mandá las cuentas por WhatsApp") + ilustración/ícono.
- [ ] **P1** Tab Personas con solo el organizador: el empty state de `PersonasView.tsx` nunca se ve (el organizador siempre existe). Mostrar un hint tipo "Sumá a los que vinieron para poder dividir" cuando `personas.length === 1`.
- [ ] **P1** Tab Resumen sin gastos: hoy muestra "Balances individuales" todos en $0 + un card gris. Reemplazar por un empty state único con ícono, texto y CTA "Cargar primer gasto".
- [ ] **P1** Gastos con juntada cerrada y sin gastos: el cartel "Juntada cerrada. Cuentas congeladas." aparece duplicado (banner + empty state) en `GastosView.tsx`.
- [ ] **P2** Empty state de filtro por categoría: agregar acción "Ver todos" para volver al filtro.
- [ ] **P2** Ocultar en los filtros de Gastos las categorías que no son actividades de la juntada.

## 3. Manejo de errores y validación

- [x] **P0** Botón "Guardar gasto" deshabilitado sin explicación (`CargarGasto.tsx`, `disabled={!esValido}`): el usuario no sabe qué falta. Dejarlo habilitado y mostrar los errores al tocarlo, o listar qué falta debajo del botón. Hoy el `handleSubmit` con sus mensajes casi nunca se ejecuta.
- [x] **P0** Se puede elegir la misma persona en dos filas de aportes. Validar o fusionar duplicados.
- [x] **P0** Se pueden sumar personas con la juntada cerrada: `PersonasView` no mira `juntada.estado` y `agregarPersona` tampoco lo valida (el modal de cierre dice que no se puede).
- [ ] **P1** Borrar persona deshabilitado: el motivo solo está en `title` (tooltip), invisible en mobile. Mostrar el motivo al tocar (toast o texto inline).
- [ ] **P1** Edición inline de alias en Personas no tiene `maxLength` y se salta la validación de 60 caracteres de `agregarPersona`.
- [ ] **P1** `CrearJuntada`: los errores no se limpian al escribir; agregar `maxLength` (apodo 30) para que coincida con las reglas del resto de la app.
- [ ] **P1** Monto sin tope: un número de 16+ dígitos rompe el layout y pierde precisión con `parseInt`. Poner un máximo razonable y formatear con separador de miles mientras se escribe.
- [ ] **P1** Errores que se tragan en silencio: ~~resultado de `onEliminarGasto`/`onEliminarPersona`/`onCerrarJuntada` ignorado~~ (ya muestran toast); fallo de portapapeles en `Header.tsx` y `ResumenView.tsx` sin mensaje.
- [ ] **P1** Fallo al persistir en localStorage (`useJuntada.ts`, `console.error`): avisar al usuario ("No pudimos guardar, exportá un backup").
- [ ] **P2** Error de import en `CrearJuntada`: el mensaje viene crudo de la excepción. Traducirlo a algo humano ("Ese archivo no es un backup de Juntadita").
- [ ] **P2** Agregar un Error Boundary global con pantalla de "Algo salió mal" + botón para exportar el backup.

## 4. Feedback visual

- [x] **P0** Guardar gasto: hoy el formulario se cierra y nada más. Agregar toast "Gasto guardado ✓" y resaltar brevemente la card nueva en la lista.
- [x] **P0** Crear un componente `Toast` reutilizable (hoy no existe) para: gasto guardado, persona sumada, gasto/persona borrados, juntada cerrada/reabierta, backup exportado/importado.
- [ ] **P1** Borrar gasto: ofrecer "Deshacer" en el toast en lugar de (o además de) el modal de confirmación.
- [ ] **P1** Sumar persona: animar la entrada en la lista y hacer scroll hasta ella.
- [ ] **P1** Cancelar `CargarGasto` con datos cargados descarta todo sin preguntar. Confirmar si el formulario está "sucio".
- [ ] **P1** Cerrar juntada: momento de "cierre" (check animado / resumen) en vez de solo cambiar el badge.
- [ ] **P2** Estados `:active` / `:hover` consistentes en todos los botones (hoy `Header` usa `onMouseEnter` inline; el resto no tiene).
- [ ] **P2** Vibración háptica corta (`navigator.vibrate`) al guardar en mobile.

## 5. Consistencia visual y de código

- [ ] **P0** Mover los estilos inline a clases/componentes: hay ~240 bloques `style={{…}}` (45 en `ResumenView`, 45 en `FutbolModulo`, 35 en `CargarGasto`). Es la causa raíz de casi todas las inconsistencias.
- [ ] **P1** Colores hardcodeados fuera de los tokens de `styles/index.css`: `#FFFFFF`, `#10B981`, `#3B82F6`, `#60A5FA`, `#2563EB`, `#F5A623`, `rgba(224,86,56,…)`. Crear tokens `--text-on-accent`, `--accent-blue`, `--accent-coral-soft`, etc.
- [ ] **P1** El coral significa a la vez "marca/acción primaria" y "deuda" (balances negativos y transferencias en `ResumenView`). Usar un color semántico propio para deuda.
- [ ] **P1** Botones secundarios hechos a mano (Todos/Ninguno, "+ Agregar aportante", "Nueva" del header, botones de ícono, "Cancelar" del formulario) en vez de `Button`. Agregar variantes `size="sm"` e `icon-only` y usarlas.
- [ ] **P1** Inputs: el alias en `PersonasView` es un `<input>` crudo con otro padding/tamaño que `Input`; el select y el monto en `CargarGasto` tampoco usan el componente.
- [ ] **P1** Tamaños táctiles: botones de 26–32 px (copiar alias en `Header`, borrar gasto). Mínimo 44 px.
- [ ] **P1** Escala tipográfica: hay 11, 12, 13, 14, 15, 16, 17, 18, 22, 24, 28 y 36 px sueltos. Definir 5–6 pasos como tokens.
- [ ] **P1** Modal de import con 3 botones en fila (`ResumenView.tsx`) desborda en pantallas chicas: apilarlos verticalmente.
- [x] **P2** "+ Agregar aportante" muestra el `+` dos veces (ícono `Plus` + texto).
- [ ] **P2** "Truco" en las actividades se guarda como categoría "Otros" (`CrearJuntada.tsx`, `Header.tsx`): el usuario elige "Truco" y ve "Otros" en los gastos. Unificar el naming.
- [ ] **P2** Título de `CargarGasto` descentrado: el spacer derecho mide 48 px y el botón "Cancelar" bastante más.
- [ ] **P2** Abreviaturas y tono: "3/5 pers", "(Org)", "Apodo del pibe…". Elegir un registro (voseo neutro) y no abreviar.
- [ ] **P2** "Promedio por cabeza" divide por todas las personas aunque no todas participen de cada gasto: es engañoso. Cambiar el texto o el cálculo.
- [ ] **P2** Safe area: `CargarGasto` usa `env(safe-area-inset-bottom, 16px)` directo en vez de `var(--safe-bottom)`.
- [ ] **P2** El FAB en Personas enfoca el input con `querySelector` por placeholder (`App.tsx:120`): frágil, usar `ref`.

## Extra: accesibilidad (suma mucho a "producto profesional")

- [ ] **P1** Filas de participantes en `CargarGasto` son `<div onClick>`: no se pueden usar con teclado ni lector de pantalla. Usar `<button role="checkbox" aria-checked>` o `<label><input type="checkbox">`.
- [ ] **P1** Labels sin `htmlFor` (Categoría, Actividades) y campos que solo tienen placeholder (Apodo, Alias, Monto).
- [ ] **P2** Modal: atrapar el foco dentro y devolverlo al cerrar.
