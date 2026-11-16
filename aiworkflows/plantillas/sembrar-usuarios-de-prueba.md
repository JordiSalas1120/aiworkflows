# Plantilla · Script que siembra los usuarios de prueba por rol (E5)

> Sirve para cualquier proyecto con roles y permisos. Se adapta al lenguaje y a la base del proyecto; lo que no cambia es el contrato.

## Por qué

Un recorrido en el navegador sólo prueba lo que el usuario de prueba puede hacer. Si el «firmante de nivel 2» no tiene permiso de firmar, el recorrido tiene que tocar roles a mano en el entorno, y eso (a) tapa errores de permisos y (b) deja el entorno distinto cada vez. Los usuarios de prueba se **siembran**, no se improvisan.

## Contrato del script

1. **Idempotente.** Correrlo dos veces deja el mismo resultado. Busca por una clave estable (el correo de prueba) y actualiza o crea.
2. **Sólo en entornos de prueba.** La guarda vive en el mismo lugar de la escritura: se niega a correr si el nombre de la base o la dirección apuntan a producción (misma idea que 11.4).
3. **Una tabla de personas de prueba en un solo archivo** (datos, no código). Una fila por persona:

   | Persona de prueba | Rol | Permisos que TIENE | Permisos que NO tiene (a propósito) |
   |---|---|---|---|
   | vendedor | quien crea | crear, editar lo propio | aprobar, ver costos |
   | aprobador nivel 1, 2, 3 | quien firma | aprobar en su nivel | aprobar fuera de su nivel |
   | observador | sólo lectura | ver | todo lo demás |
   | administrador de la empresa | administra | todo lo de la empresa | nada de otras empresas |
   | sin permiso de ver costos | igual al vendedor | lo del vendedor | ver costos |
   | **una persona en dos empresas** | un rol distinto en cada una | distinto en cada una | (prueba de aislamiento, 8.3) |

   Cada proyecto escribe sus propios roles. La regla: **hay al menos una persona por cada rol y por cada permiso que cambia lo que se ve**, incluida la que NO lo tiene.
4. **Los permisos se asignan por la vía real** (el mismo mecanismo que usa la pantalla de administración o la migración), no con atajos que saltean la validación.
5. **Imprime una tabla al final**: correo, rol, empresa y cómo se entra. Esa tabla va al informe del recorrido.
6. **Datos de prueba, no personas reales.** Correos de un dominio de prueba que no llega a ningún buzón real. Un correo de prueba que le llega a una persona real es un incidente.

## Pseudocódigo

```
para cada fila de TABLA_DE_USUARIOS_DE_PRUEBA:
    empresa = buscar_o_crear(fila.empresa)
    usuario = buscar_o_crear_por_correo(fila.correo)
    asignar_rol(usuario, empresa, fila.rol)                 # por la vía real
    fijar_permisos(usuario, empresa, fila.permisos_si, fila.permisos_no)
verificar: para cada fila, preguntar a la API «¿qué puedo hacer?» con ese usuario y comparar con la fila
imprimir tabla
```

El último paso (verificar contra la API) evita que lo «sembrado» y lo «efectivo» difieran.

## Cuándo se corre

**Antes de cada recorrido** (8.1) y después de cada migración que toque permisos. Si el recorrido necesita un usuario que no está en la tabla, se **agrega a la tabla** y se vuelve a sembrar; no se arregla a mano en el entorno.
