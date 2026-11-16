## 17. Lecciones aprendidas: qué pasó → qué regla quedó

| Qué pasó | Regla |
|---|---|
| 2.296 tests verdes y la funcionalidad no servía | Verificar donde la persona ve el resultado (1.3) |
| 885 tests no vieron 2 defectos que un minuto de navegador sí | Navegador antes del PR y después del despliegue (8.1) |
| Se desplegó verificando sólo por la API y llegaron 3 bugs al cliente | `rama → dev → navegador → merge → prod → navegador` |
| Se desplegó durante una presentación | Una condición de contexto es una orden (1.8) |
| Las reglas de modelo existían y Opus igual construyó 75 tareas y 100 rondas, y se re-planificó 25 veces (dos meses de un proyecto grande) | Una regla que nada hace cumplir no existe: `SKILL.md` + la guardia + medir cada lote (15.8) |
| Planes escritos el mismo día que hubo que re-auditar y corregir uno por uno, 69 min cada vez | Uno detrás del otro; si el código se movió, anclas y re-auditar sólo lo roto (5.5) |
| Un plan de pantallas no conocía el motor construido después | Auditar cada plan contra el código antes de construir (5) |
| La maqueta prometía 13 datos que el backend no tenía | Cruzar la maqueta dato por dato; construir el backend primero (3.3) |
| El simulador y el motor calculaban distinto | Una sola función para lo mismo (12.2) |
| La "marca" era el vendedor: 7 % de cobertura real, no 87 % | Medir el contenido real de un campo antes de usarlo |
| Un rol de la empresa A daba permisos en la B | Lo de la empresa vive en la relación persona-empresa; probar con dos empresas (8.3) |
| La "fuga" era el modo superadministrador | Desconfiar de los modos especiales (8.4) |
| Tres tablas de cotizaciones; el guardián miraba la equivocada | Antes de proteger algo, confirmar **dónde** vive de verdad |
| El filtro se aplicaba después del tope y escondía resultados buenos | El orden de filtros, límites y ordenamientos cambia el resultado: se prueba |
| El `limit` cambiaba el orden de los resultados | Ídem: probar con y sin límite |
| El hook de pre-commit no corrió en 12 tareas y los informes decían que sí | Verificar que el hook existe en cada worktree; afirmar sólo lo que se vio (15.7) |
| Una ronda de arreglos de diseño pasó todos los tests y 5 de 14 seguían mal en pantalla | Lo de forma se verifica en el navegador contra la maqueta, con capturas |
| Un texto explicaba qué regla «decide» comparando todas contra todas, y el motor elige por producto | Un texto que explica una decisión del motor usa el mismo criterio que el motor, con tests de los casos que se cruzan |
| Un endpoint recortaba a 100 y la pantalla pedía 500 | Límites silenciosos: la pantalla busca en el servidor |
| Se borró la base de producción con una limpieza | Guarda pegada a la operación destructiva (11.4) |
| Secretos en un archivo de configuración commiteado | Nada de secretos en git; si entró, rotar (9.4) |
| Producción con la contraseña del seed | Credenciales de demo nunca en producción |
| Un mock incompleto se veía como un 500 del endpoint | El mock declara todo lo que exporta el módulo (11.3) |
| "Seguimos con 6 rojos" escondía cambios | Comparar listas, no cantidades |
| `| tee` devolvía éxito aunque el comando muriera | Verificar el código de salida real del comando, no el de la tubería |
| Matar todos los `node` mató herramientas ajenas | Procesos locales: matar por PID; "el puerto responde" ≠ "mi proceso arrancó" |
| Dos notas con el mismo número rompieron enlaces | Mirar el último número en todas las ramas (10.1) |
| El primer intento de acelerar dio 3 % y se supo tras 8 minutos | Medir el cambio solo, antes de la prueba larga (1.2) |
| Se quitó más de lo pedido en un rework de pantalla | Listar y confirmar lo que se va a quitar **antes** de quitarlo |
| Desvincular en masa borró el historial | Las operaciones masivas destructivas se muestran en seco y se confirman |
| Una tarea «chica» de tipos traía fechas un día antes, y otra de dos archivos se olvidaba una pestaña entera | La revisión por tarea no se saltea por tamaño: se escala el revisor (6.3) |
| Un plan auditado dos veces quedó viejo en siete puntos por un trabajo construido entre medio | Auditoría previa en paralelo con la primera tarea (5.4) |
| 1.304 tests verdes y cada tarea revisada; el navegador encontró 8 defectos | La tarea de cierre recorre todas las pantallas con lista y capturas (8.1) |
| 6 de 15 roturas a propósito pasaban sin un rojo | Mutaciones en plata, permisos y aislamiento (11.7) |
| Un CSV sin la columna de costo borraba todos los costos, y guardar un formulario pisaba la configuración de cada producto: ambos venían de antes | Cuando una tarea reescribe un camino, lo previo que pasa por ahí se arregla en esa tarea, con su test |
| El dueño miró la pantalla vieja y creyó que el rework había fallado | Cada resumen dice qué pantalla cambia y dónde se ve (16) |
| Un agente de pruebas con un filtro demasiado amplio corrió la suite entera 10 minutos y dejó 5 empresas de prueba en la base local | Filtros de prueba por nombre de archivo exacto; lo que queda en la base se anota y se le pregunta al dueño antes de borrar |
| Varios agentes en el mismo árbol | Un solo agente escribe a la vez; los arreglos esperan su turno (6.5) |
| «No sacrificar calidad» se tradujo en «Opus para todo»: el 98 % del gasto del plan 3 fue Opus, también transcribiendo código que el plan ya traía y revisando diffs de una pantalla. La semana anterior el límite semanal se agotó el miércoles | El modelo se elige por lo que la tarea exige pensar, con las barandas de 15.6; la revisión nunca se recorta |
| Planes escritos con el código exacto semanas antes de construirlos: el plan 3 se auditó cuatro veces porque el código cambiaba debajo | El plan siguiente se escribe cuando el anterior está construido (15.6) |
| Un editor «listo» con miles de tests verdes llevó 25 arreglos en 2 días, todos hallados en el navegador | «Listo» = recorrido de la tabla de estados × roles, con usuarios sembrados, 0 ❌ (8.1, 14.1, regla 0 de `SKILL.md`) |
| El mismo estado se calculaba en tres lugares y tres rondas arreglaron uno cada vez | Tabla de estados antes de construir, una función compartida y un test que recorre la tabla (3.5) |
| Reglas de comportamiento construidas «provisionales» se revirtieron con el lote ya «listo» | Las decisiones de comportamiento se preguntan al inicio y no se construyen sin respuesta (3.2, 6.9) |
| 286 scripts de recorrido y 654 capturas en una carpeta temporal, nada repetible | El recorrido es una spec del repo, parte del PR (8.1, 11.4) |
| Los firmantes de prueba no tenían permiso de firmar; el recorrido tocó roles a mano en el entorno | Usuarios de prueba sembrados por un script idempotente (8.3) |
| La pantalla nueva salió con ~79 % de colores fijos copiados de la maqueta; el modo oscuro quedó imposible y 30 aserciones de test congelaron los colores | Maqueta mapeada a tokens (3.3); trinquete contra colores, alturas y roles fijos; los tests no afirman clases de color (13) |
| Una auditoría «de SaaS ideal» propuso trabajo que el dueño había descartado | Alcance escrito con SÍ y NO; se audita contra él (1.11) |
| La suite completa corría 3 veces por ronda con la máquina al 100 % | Completa sólo al cerrar o integrar; máximo 3 agentes y una suite a la vez (6.4) |
| El CI quedó caído por facturación dos veces y se descubrió a mitad del lote | Chequear CI y deploy antes de empezar; el deploy manual se declara oficial al inicio (9.1) |
| La regla de costo existía; nadie medía el retrabajo | Se mide el retrabajo al cerrar cada lote (14.2) |
| Informes de 40 KB y memorias de 59 KB que nadie leía | Informe de una página, nota de dos, memoria de 3 KB (10.1, 15.3) |
| El dueño no encontró la funcionalidad porque nadie le dio el enlace | Cada guía lleva el enlace directo y el entorno (10.3, 16) |
| QA devolvió un ticket por un «riesgo conocido» que había decidido dev: un doble pago en silencio | Ningún riesgo aceptado sin la firma del dueño; si QA lo puede ver como bug, se arregla antes de cert (24.10) |
| El estado heredado era correcto, pero el asistente igual le preguntaba a la persona | El esperado de cada caso es lo que ve la persona, no el estado interno (24.3) |
| «Sigue pendiente» después de pagar, por un 401 que sólo daba el simulador de cert; una clave de dev con un espacio no dejaba cotizar | La matriz de entornos lista lo que difiere en cada uno, y se chequea en cert (24.3) |
| En cert no andaban coordenadas con DMS, con coma decimal o invertidas | Particiones de equivalencia y bordes en cada entrada libre (24.3) |
| Tres tickets pasaron a cert sin probarse en dev | 0 ❌ en dev antes de cert (regla 0-bis) |
| 52 subagentes y ~108 US$ en un lote de 3 tickets | 4 subagentes por ticket como tope; lo de QA va dentro de los encargos que ya existen (24.13) |
