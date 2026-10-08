# Búsqueda inicial (F1-02)

La búsqueda global comienza con el único contenido funcional disponible: tareas. Consulta título y descripción sin distinguir mayúsculas, con una entrada de 1 a 80 caracteres. Salud y cualquier módulo futuro quedan fuera hasta definir explícitamente su participación; los datos de salud nunca se incorporarán.

`public.search_tasks` usa `security invoker`, por lo que se ejecuta con el rol del usuario y conserva las políticas RLS de `tasks`. La función no agrega permisos ni utiliza claves privilegiadas. Las pruebas pgTAP verifican que una coincidencia de otro usuario y otro espacio no aparece.

La ruta `/search` es SSR y protegida. Los resultados enlazan a la vista filtrada de tareas. No se añade todavía índice de texto completo: el volumen real debe medirse antes de elegir idioma, normalización o una estrategia de búsqueda más compleja.
