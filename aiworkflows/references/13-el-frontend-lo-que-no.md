## 13. El frontend: lo que no se negocia

- **No prometer datos que el backend no tiene.** Cada número de la pantalla tiene una fuente conocida (ver 3.3).
- **El rótulo no puede mentir.** Si el archivo o el número está bien pero la etiqueta dice otra cosa, la persona toma una decisión equivocada.
  > **📌 Caso real.** Dos veces el archivo exportado estaba bien y el rótulo mentía. Y una fila de totales mostraba el total **sin** impuesto en la columna **con** impuesto: la regla estaba en el Excel y la pantalla no la seguía.
- **Sin nombres de campos internos en la interfaz** (`brandManual`, `strategyConfig`). Se usa el lenguaje de la persona.
- **Los estados vacíos dicen la verdad:** "falló la carga" no es "no hay productos". Un falso vacío hace creer que no hay datos.
- **Las búsquedas buscan en el servidor**, no sólo en lo que ya se cargó en la página.
- **Los permisos de la pantalla son los del servidor** (ver 12.9).
- **Idioma consistente:** textos de interfaz en el idioma del usuario y código en inglés, o la convención que se fije, pero siempre la misma.
- **Sin colores, alturas ni roles fijos en el código** (E6). En código nuevo o tocado, un chequeo automático falla con: un color escrito a mano (`#hex`, `rgb()`) en la clase o el estilo de un componente, un fondo blanco fijo, un gris de la paleta (`text|bg|border-gray-N`), un alto calculado a mano (`calc(100vh - Npx)`) y una comparación con el nombre de un rol base. Funciona como **trinquete**: el conteo por archivo **puede bajar y nunca subir**, y un archivo nuevo arranca en cero. Herramienta: `scripts/`. **Los tests no afirman clases de color**: un test que exige un color congela el error y rompe al pasar al tema. Los casos legítimos (documentos impresos, gráficos, ilustraciones) van en una lista de excepciones explícita.
- **La pantalla usa tokens del tema**, no valores de la maqueta (3.3). Un modo oscuro o una marca por cliente deben ser un cambio de tema, no de cada archivo.
- **Enlaces entre "planos" distintos** de la aplicación (por ejemplo, del panel de plataforma al portal de una empresa): navegación completa, no del enrutador interno, cuando cambia el contexto.
