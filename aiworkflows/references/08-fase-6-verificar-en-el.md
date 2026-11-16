## 8. Fase 6 · Verificar en el mundo real

### 8.1 En el navegador, antes de subir

Toda funcionalidad con pantalla se prueba **en el navegador**, con la aplicación corriendo y datos parecidos a los reales, **antes** de abrir el PR y otra vez después de desplegar:

```
rama → dev → NAVEGADOR → merge → prod → NAVEGADOR
```

> **📌 Caso real.** Se desplegó verificando sólo por la API y llegaron 3 bugs de pantalla que el cliente vio primero.

> **📌 Caso real (plan de referencia).** Con cada tarea revisada y 1.304 tests verdes, el recorrido en el navegador de la tarea de cierre encontró **8 defectos que nadie había visto**:
> - las etiquetas de precio de la barra se pisaban;
> - una tarjeta contaba dos veces (el backend sumaba a los «sin precio posible» también en «suben»);
> - el piso de un rango se imprimía redondeado hacia abajo, un precio que rompía la regla;
> - la ficha decía «Sin estrategia» y, justo debajo, «Estrategia actual: …»;
> - y cuatro más.
>
> La revisión lee código; el navegador muestra lo que ve la persona. **Uno no reemplaza al otro.**

**«Listo» es esto** (E1): el recorrido en el navegador de la **tabla de estados × roles** del spec (3.5), con los **usuarios de prueba sembrados** (8.3), **en el entorno de verificación**, con **0 ❌**. El informe del recorrido (una página como máximo) es la prueba. Sin él no se dice «listo», «terminado» ni «para producción»: se dice «construido, falta verificar». «Se verificó en el navegador» sin esa lista y sin esos usuarios no cuenta.

> **📌 Caso real.** Un editor se declaró «listo y ensayado» con unos 15.000 tests en verde. Dos días después llevaba cuatro PR más con 25 arreglos, todos encontrados en el navegador. Antes del recorrido completo, de 128 pedidos del checklist sólo el 37 % tenía evidencia en el entorno de verificación: el resto estaba probado sólo en local, sin navegador o sin hacer.

**El recorrido es una spec del repo, no un script descartable** (E4): se escribe **una vez** como prueba de navegador versionada (`plantillas/recorrido-de-pantallas.md`), es parte del PR, y después se **repite la spec** y se recorre a mano **sólo lo que cambió**. Un lote que reescribe cada recorrido deja cientos de scripts y capturas en una carpeta temporal y nada repetible, y 9 recorridos completos en 3 días vuelven a probar lo que ya andaba.

**Cómo se hace el recorrido para que sirva:**
- **Una lista escrita de pantallas y de lo que tiene que pasar en cada una** (la tabla de estados), no «mirar un rato».
- **Capturas** de cada pantalla, guardadas con nombre, como evidencia.
- **Respaldo antes de tocar datos, devolución al terminar y verificación** de que quedaron iguales («0 diferencias»). Nada de probar escribiendo en la base y dejarlo así.
- **Si no hay datos reales para un caso**, se puede mirar con una respuesta inyectada, pero **se dice** que fue así. «Visto con datos de mentira» no es «verificado».
- **Los defectos que se ven no se arreglan en la tarea de cierre:** se anotan con su captura y van a la clasificación de la revisión final. Así entran a la ola única, con su test y su re-revisión.
- **El worker corre también sus trabajos programados:** lo que escriba en la base local se anota, no se borra por las dudas.

### 8.2 Seguir el dato

Para cada funcionalidad, un recorrido completo:

1. Entra un dato real (se crea, se importa, llega por integración).
2. Se sigue por cada lugar donde tiene que aparecer: listado, detalle, exportación, reporte, otra pantalla, otro sistema.
3. Se confirma el valor, no sólo que "aparece algo".

### 8.3 Sesiones y permisos: una persona en dos empresas

En una plataforma con varias empresas (multi-tenant), **todo lo que toca sesión, permisos o aislamiento de datos se prueba con una persona que pertenece a DOS empresas.** Con una sola empresa las fugas no se ven.

**Los usuarios de prueba se siembran, no se improvisan** (E5): un script **idempotente** crea una persona por cada rol y por cada permiso que cambia lo que se ve (quien crea, quienes firman en cada nivel, el observador, el administrador, quien no puede ver costos, la persona en dos empresas) **con los permisos correctos**, y se corre antes de cada recorrido (`plantillas/sembrar-usuarios-de-prueba.md`). Si el recorrido tiene que tocar roles a mano en el entorno para poder probar, el recorrido tapa errores de permisos y deja el entorno distinto cada vez.

> **📌 Caso real.** Probando así aparecieron tres fallas juntas: la sesión elegía mal la empresa, la pantalla "Mi perfil" leía el rol de la empresa equivocada y un rol personalizado de la empresa A daba permisos en la empresa B.

### 8.4 Desconfiar de los modos especiales

Los modos de administrador, de soporte o de "ver como" pueden mostrar datos que la persona real no ve.

> **📌 Caso real.** Se reportó una "fuga de cotizaciones": 15 cotizaciones visibles que no correspondían. No existía la fuga: se estaba mirando con un token de superadministrador. La sesión real de esa persona veía 2.

### 8.5 Medir el rendimiento con datos reales

Con el volumen real (o uno comparable) se miden los tiempos de las operaciones nuevas y se anotan: "la foto del catálogo tarda 1,9-2,2 s sobre 4.437 productos; leerla, 10 ms".
