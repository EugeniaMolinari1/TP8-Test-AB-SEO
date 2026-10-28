
# TP8 – Laboratorio de Test A/B y SEO

**Licenciatura en Sistemas de Información**  
**Programación Avanzada – 2026**

## Descripción

Trabajo práctico que implementa un experimento A/B para la landing de Taller Norte, una escuela de oficios ficticia.

El experimento presenta dos mensajes diferentes sobre una misma oferta, manteniendo una única URL indexable.

## Tecnologías utilizadas

- Next.js y TypeScript
- PostgreSQL (Neon)
- Vercel para el despliegue
- Git y GitHub

## Funcionalidades

- Asignación estable de variantes A y B mediante el algoritmo FNV-1a.
- Identificación del visitante y persistencia de la variante mediante cookies.
- Metadatos SEO diferentes por variante y canonical único.
- Vista previa de ambas variantes mediante `?preview=a` y `?preview=b`.
- Registro de una impresión por sesión de 30 minutos.
- Registro de una conversión por visitante al presionar el CTA.
- Almacenamiento de eventos en PostgreSQL.
- Bitácora con impresiones, conversiones y tasas por variante.

## Enlaces del proyecto

- **Landing:** https://tp-8-test-ab-seo.vercel.app/practica
- **Bitácora:** https://tp-8-test-ab-seo.vercel.app/bitacora

## Ejecución local

1. Clonar el repositorio.
2. Instalar las dependencias:

```bash
npm install
```

3. Crear el archivo `.env.local` con la variable `DATABASE_URL`, utilizando la cadena de conexión de Neon.
4. Crear las tablas de la base de datos ejecutando `db/schema.sql` en Neon.
5. Iniciar el servidor:

```bash
npm run dev
```

6. Abrir `http://localhost:3000/practica` o `http://localhost:3000/bitacora`.

## Caso de prueba fijo

| Variante | Impresiones | Conversiones | Tasa |
|---|---:|---:|---:|
| A – Control | 240 | 18 | 7,50 % |
| B – Tratamiento | 236 | 31 | 13,14 % |

**Diferencia B − A:** 5,64 puntos porcentuales.

El identificador `lab-visitor-demo-01` se asigna de manera estable a la variante B mediante FNV-1a.
