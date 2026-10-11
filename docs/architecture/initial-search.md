# Búsqueda global (F1-02, ampliada en F2-09)

La búsqueda global consulta tareas y notas autorizadas sin distinguir mayúsculas,
con una entrada de 1 a 80 caracteres. En tareas busca título y descripción; en
notas, título y la representación de texto plano derivada del documento
estructurado. Salud y cualquier módulo futuro quedan fuera hasta definir
explícitamente su participación; los datos de salud nunca se incorporarán.

`public.search_tasks` y `public.search_notes` usan `security invoker`, por lo
que se ejecutan con el rol del usuario y conservan las políticas RLS de sus
tablas. Las funciones no agregan permisos ni utilizan claves privilegiadas.
Las pruebas pgTAP verifican coincidencias positivas y negativas entre espacio
personal, espacio compartido y un usuario externo.

La ruta `/search` es SSR y protegida. Agrupa resultados por tipo; las tareas
enlazan a su vista filtrada y las notas a su página. No se añade todavía índice
de texto completo: el volumen real debe medirse antes de elegir idioma,
normalización o una estrategia más compleja.
