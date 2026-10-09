# Notas básicas (F2-01)

La primera vertical de notas permite crear, leer, editar y eliminar contenido de texto plano en espacios personales y compartidos. El título admite 160 caracteres y el cuerpo 50.000. React presenta el texto escapado; esta entrega no almacena ni interpreta HTML.

La autorización hereda la matriz de espacios: propietario personal y miembros `admin`/`editor` modifican; `viewer` solo lee. PostgreSQL RLS es la barrera efectiva y las pruebas cubren cuatro usuarios, dos espacios compartidos y acceso anónimo.

Quedan fuera hasta verticales posteriores: jerarquía, editor por bloques, texto enriquecido, tablas, imágenes, código, enlaces internos, plantillas, adjuntos, búsqueda, versiones y colaboración simultánea. No se añade Tiptap antes de diseñar sanitización, adjuntos y versionado.
