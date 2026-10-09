# Tareas de proyecto, subtareas y reajuste visual

Las tareas pueden referenciar un proyecto mediante `project_id` y otra tarea mediante `parent_task_id`. Ambas relaciones deben permanecer en el mismo espacio. Un trigger impide autorreferencias, ciclos y relaciones cruzadas; borrar un proyecto o tarea padre conserva las tareas y elimina únicamente la referencia.

La interfaz de proyectos permite captura rápida de tareas raíz y subtareas. Es una primera iteración tipo Todoist/Notion; reordenación, profundidad visual avanzada y edición completa llegarán después.

El sistema visual se reajusta hacia la referencia acordada: superficies blancas, acento azul, navegación compacta, densidad mayor y cabecera panorámica. La imagen de ciudad es un recurso original generado para el proyecto, no una copia de la referencia.
