## 9. Fase 7 · Desplegar

### 9.1 Entornos y puertas

| Entorno | Para qué | Quién decide subir |
|---|---|---|
| Local | Construir y probar | El desarrollador |
| Dev | Verificar integrado, con datos parecidos a los reales | El equipo, con aviso |
| Prod | Usuarios reales | **Sólo el dueño del producto, explícitamente** |

- El camino a dev es un PR desde la rama de trabajo (subida con la puerta, 27.4) a `develop` (o a la rama principal, si el proyecto no tiene `develop`); el CI/CD despliega.
- **Cómo** se despliega (CI, CD, migraciones, vuelta atrás, observabilidad, bitácora de despliegues): ver **28**.
- Producción se dispara a mano, con una confirmación deliberada.
- **No se ofrece subir a producción por iniciativa propia.** Se informa que está listo y se espera.
- **Antes de empezar un lote, se chequea que el CI y el deploy anden** (E12): la facturación de la plataforma de CI, el runner (¿está encendido?, ¿alcanza la memoria del servidor?), el acceso al entorno. Si no andan, **el deploy manual documentado es el camino oficial y se dice al empezar el lote**, no a mitad. Un CI caído en silencio deja tests rojos invisibles en la rama principal y horas perdidas diagnosticando lo que el CI tendría que decir solo.

### 9.2 Antes de producción

- ¿Hay migraciones? ¿Se ensayaron contra una copia de producción? ¿Cuánto tardan?
- ¿Cambian datos visibles (precios, permisos, lo que ve cada rol)? Se mide **en producción, con una consulta de sólo lectura**, a quién afecta y cuánto, y se le muestra al dueño antes.
- ¿Hay scripts de relleno de datos? Se corren primero en modo seco ("haría esto con N registros").
- ¿Hay que desplegar dos cosas juntas? Una parte que funciona sola puede romper la pantalla vieja. Se anota y se decide si se frena el despliegue.

> **📌 Caso real.** El motor nuevo aceptaba montos fijos y condiciones que la pantalla vieja no conocía: con el motor solo en producción, la pantalla vieja daba error 400. Se decidió subir el motor a producción únicamente junto con las pantallas nuevas.

### 9.3 Después de producción

- Verificar en el navegador (ver 8.1).
- Revisar los logs de las primeras horas.
- Ante una caída, lo primero es mirar si el problema es del proveedor (la página de estado del proveedor de nube) antes de tocar nada.

### 9.4 Secretos

- **Ningún secreto en git:** ni tokens, ni contraseñas de base, ni contraseñas del seed. Si entró uno, **hay que rotarlo**: sigue vivo en el historial aunque se borre el archivo.
- Producción no puede usar credenciales de ejemplo o de demo.
