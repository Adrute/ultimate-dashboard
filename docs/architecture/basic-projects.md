# Proyectos básicos (F2-02)

La vertical inicial gestiona nombre, descripción, estado, progreso y fechas en espacios personales o compartidos. PostgreSQL valida progreso entre 0 y 100 y que la fecha inicial no sea posterior a la final.

La autorización reutiliza la matriz de espacios: propietario personal y miembros `admin`/`editor` modifican; `viewer` solo lee. RLS y privilegios de columna impiden mover proyectos entre espacios o alterar su autor.

Etapas, hitos, tareas relacionadas, notas relacionadas y archivos quedan fuera. Cuando se añadan, usarán claves externas al proyecto; no se copiará contenido de otros módulos.
