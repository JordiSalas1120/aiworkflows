## 11. Las pruebas, en detalle

### 11.1 Los niveles y qué prueba cada uno

| Nivel | Qué prueba | Con qué | Qué NO ve |
|---|---|---|---|
| **Unitario** | Lógica pura: cálculos, reglas, transformaciones | Funciones aisladas, datos armados a mano | SQL real, integración, la pantalla |
| **De punta a punta (API)** | El endpoint completo contra una **base real** | Servidor en memoria + base de prueba | La pantalla, el navegador |
| **Frontend** | Componentes, estados y formularios | Testing library + mocks de la API | Si la API real devuelve eso |
| **Navegador** | Lo que la persona ve y hace | La aplicación corriendo | Casos borde que no se recorrieron |
| **Datos reales** | Coberturas, volúmenes, calidad del dato | Consultas de sólo lectura | — |

⚖️ **Cada nivel tapa huecos del otro. Ninguno reemplaza a otro.**

### 11.2 Lo que conviene probar sí o sí

- **El caso sin datos:** sin costo, sin competencia, lista vacía, campo nulo.
- **Los bordes:** 0, negativo, infinito, el límite exacto, el límite más uno.
- **Concurrencia:** dos operaciones iguales a la vez (doble aprobación, doble clic, dos jobs).
- **Aislamiento entre empresas:** el dato de A nunca aparece en B.
- **Permisos, uno por uno:** con y sin cada permiso, también para roles personalizados.
- **Que lo que se muestra es lo que se aplica:** si hay un simulador, su resultado es igual al del motor real, porque llaman **a la misma función**.
- **Regresión:** cada bug arreglado deja su test, y se comprueba que da **rojo sin el arreglo**: `scripts/rojo-sin-arreglo.mjs` (24.7).
- **Cómo elegir los casos:** particiones, bordes, tabla de decisión, transiciones de estado, pairwise y entornos, en la matriz de pruebas (24.3).

### 11.3 Las trampas conocidas

| Trampa | Qué pasa | Cómo se evita |
|---|---|---|
| **Los tests con mocks no ven el SQL** | Un test mockeado pasa y la consulta real falla | Pruebas de punta a punta contra una base real para todo lo que toca SQL |
| **Un mock reemplaza el módulo entero** | Si el mock no declara una función que otro archivo importa, estalla como un error 500 del endpoint, no como un error de mock | El mock declara **todo** lo que el módulo exporta, y hay un test que lo controla |
| **Un test unitario que pega a una base real** | "Unitario" que en realidad lee la base de desarrollo: el conteo de tests miente | Detectarlo y aislarlo; los unitarios no tocan la red ni la base |
| **Comparar cantidades en vez de listas** | "Sigue en 6 rojos" esconde cambios | Comparar la lista de nombres de tests que fallan |
| **Modo watch** | `npm test` queda escuchando y no termina | Usar el comando de corrida única (`vitest run`) |
| **Mediciones no deterministas** | Resultados que cambian entre corridas (IA, orden, cache) | Fijar la semilla o el orden, medir varias veces, informar el rango |
| **El formateador del CI es otra versión** | Localmente pasa y el CI falla por formato | Usar la versión del lockfile, no la última |
| **Fin de línea en Windows** | Falsos positivos de formato por CRLF | Configurar git y el formateador; saberlo |

### 11.4 Las pruebas de punta a punta contra una base real

- Base **exclusiva** de pruebas, con un nombre que la delate (`..._test`).
- **Guarda en el mismo lugar de la operación destructiva:** la función que vacía la base verifica ella misma que el nombre contenga `_test` y que no sea producción. No alcanza con una guarda en otro archivo, que se puede saltear.
  > **📌 Caso real.** Una vez se borró la base de producción por correr una limpieza apuntando al lugar equivocado. Desde entonces la guarda vive pegada a la operación.
- Cada archivo arranca con la base vacía, y **se verifica** que quedó vacía.
- La preparación cara (migraciones, generar el cliente de la base) se hace **una vez por corrida**, no por archivo.
- Los jobs en segundo plano y los servicios externos (correo, mensajería, scrapers) se reemplazan por versiones falsas.
- **Los recorridos de navegador también son pruebas del repo** (E4): specs versionadas junto al PR, que usan los usuarios sembrados (8.3) y la tabla de estados (3.5). Ver 8.1 y `plantillas/recorrido-de-pantallas.md`.

### 11.5 Una prueba que falla al azar es un bug

Un test que "a veces falla" enseña a ignorar los rojos, y un día el rojo es real. **Se investiga hasta encontrar la causa**: un timeout, el orden, datos compartidos, la hora. No se reintenta hasta que pase.

### 11.6 Rapidez sin perder calidad

Lo que sí se optimiza:

- la preparación repetida (hacerla una vez por corrida);
- la limpieza de la base (tocar sólo lo que tiene datos);
- la infraestructura (Docker, discos, conexiones);
- el orden de trabajo (revisar mientras se construye).

Lo que no se toca: la cantidad de tests, lo que verifican, los timeouts (subirlos esconde el problema) y el aislamiento entre archivos.

### 11.7 Romper el código a propósito (mutaciones)

La cantidad de tests no dice si protegen. **Romper el código a propósito sí.**
1. Se eligen los lugares que importan: cálculos de plata, permisos, filtros por empresa, concurrencia.
2. Se introduce un error por vez: cambiar un `>` por un `>=`, borrar un filtro, invertir una condición.
3. Se corre la suite. Si **nada se pone rojo**, esa lógica no está protegida.

Un pequeño guion lo automatiza. Las mutaciones se describen **por texto, no por número de línea**, así sobreviven a los cambios. Se corren antes y después del trabajo, y la meta es **cero mutaciones que sobreviven**. Una mutación que no cambia el comportamiento (equivalente) se anota como tal.

> **📌 Caso real (saneamiento de un proyecto).** Con 2.764 unitarios, 310 de punta a punta y 1.042 de frontend en verde, se rompió el código en 15 lugares. **9 se atraparon y 6 pasaban sin un rojo**; una era un CSV que importaba sin filtrar por empresa. Después de escribir las pruebas que faltaban: **35 mutaciones, 34 atrapadas, 1 equivalente, 0 sobrevivientes**. Las pruebas escritas primero destaparon defectos reales: un margen de 100 % tiraba la corrida entera, y aprobar 900 podía aplicar 850.

⚖️ **Cuándo es obligatorio:** en todo lo que toca plata, permisos o aislamiento entre clientes, y cuando alguien pregunta «¿los tests son de verdad?».

> **📌 Caso real.** Vaciar la base con `TRUNCATE ... CASCADE` tardaba 11-14 s por archivo aunque la base estuviera vacía: Postgres crea un archivo nuevo por cada tabla e índice, unas 700 relaciones. Además, el `CASCADE` desde la tabla de empresas arrastraba 136 tablas aunque sólo 9 tuvieran filas. Borrando sólo esas 9, y verificando después que todo quedara vacío: **2 ms**. La suite pasó de 498 s a 160 s con los mismos 310 tests.
