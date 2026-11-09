# Manual básico de administración

## Ingresar
1. Ve a `/admin` (o a «Acceso institucional» en el pie de página).
2. Ingresa con tu correo y contraseña. Después de 5 intentos fallidos, la cuenta se bloquea 10 minutos.
3. El menú lateral muestra solo las secciones que tu rol permite.
4. **La primera vez**, cambia la contraseña temporal en **Mi cuenta y contraseña** (abajo, en el menú lateral). Debe tener al menos 12 caracteres; al cambiarla se cierran tus sesiones abiertas en otros equipos.

## Roles
| Rol | Puede |
|---|---|
| Superadministrador | Todo, incluidos usuarios y configuración |
| Administrador institucional | Postulaciones (revisar y exportar), organigrama, personas, territorio, proyectos, internacional, historia, auditoría |
| Administrador de comunicación | Revisar y publicar artículos, autores, multimedia, eventos |
| Editor jefe | Aprobar y publicar artículos |
| Editor | Revisar artículos (no publica) |
| Autor | Enviar artículos a revisión (no publica) |
| Coordinador regional | Contenido de su región, eventos |
| Administrador de proyectos | Proyectos y eventos |

Nadie sin la capacidad `org.edit` o `people.edit` puede modificar el organigrama ni las fichas de autoridades.

## Revisar postulaciones
1. Abre **Postulaciones** y filtra por modalidad o estado.
2. Abre una solicitud para ver todos sus datos. Cada consulta queda registrada en la auditoría.
3. En **Cambiar estado**, elige *En revisión*, *Información solicitada*, *Aprobada*, *Rechazada* o *Archivada*. Puedes agregar una nota interna.
4. El historial muestra cada cambio con la persona y la hora.

Ninguna postulación se aprueba automáticamente. Los datos de postulantes nunca aparecen en el sitio público.

## Editar contenidos
El menú lateral agrupa los contenidos editables: **Institución** (personas, órganos, línea de tiempo), **Territorio** (regiones, departamentos), **Trabajo** (proyectos, eventos, participaciones internacionales, alianzas), **Editorial** (categorías) y **Sistema** (configuración, usuarios, auditoría).

- **Lista:** busca por nombre, abre un registro o crea uno con «+ Nuevo».
- **Formulario:** el identificador URL se genera solo si lo dejas vacío. En los campos de varias líneas, escribe un elemento por línea; en las tablas, separa las columnas con «|».
- **Imágenes:** JPG, PNG o WEBP de hasta 8 MB. El sistema comprueba el tipo real del archivo.
- **Eliminar:** marca la casilla de confirmación. Si otros registros dependen de este, el sistema no lo borra; desactívalo en su lugar.

### Cambiar autoridades
1. **Personas y autoridades** → abre a la persona (o créala).
2. En **Cargos**, agrega el cargo, elige el órgano, escribe el período y marca **En funciones**.
3. Al terminar un período, desmarca **En funciones** en el cargo anterior: pasa al historial y a la galería de presidentes.
4. **Electo (aún no asume)** muestra la tarjeta de «Presidente electo» hasta la toma de posesión.

### Regiones del mapa
En **Departamentos**, asigna la región de cada departamento. El mapa se colorea automáticamente.

### Usuarios
**Usuarios** permite crear cuentas, cambiar roles, desactivar cuentas y restablecer contraseñas. La contraseña temporal se muestra **una sola vez**. Siempre debe quedar al menos un superadministrador activo.

## Medio editorial (Actualidad)

### Estados de un artículo
Borrador → Enviado a revisión → En revisión → (Requiere correcciones ↺) → Aprobado → Programado → Publicado → Archivado.

| Rol | Qué puede hacer |
|---|---|
| Autor | Escribir, guardar borradores y **enviar a revisión**. Solo ve sus propios artículos y solo puede editarlos en *Borrador* o *Requiere correcciones*. |
| Editor | Ver todos, tomar en revisión, editar y **solicitar correcciones** (con comentario obligatorio). No publica. |
| Editor jefe / Administrador de comunicación | Todo lo anterior, más **aprobar, programar, publicar y archivar**. El editor jefe también puede eliminar. |

### Escribir
1. **Artículos → + Nuevo artículo**.
2. Completa título, subtítulo, categoría y portada. Escribe en el editor visual: negritas, subtítulos (H2/H3), citas, listas, enlaces, imágenes (se suben al servidor y piden un texto alternativo) y videos de YouTube.
3. Agrega las fuentes (una por línea) y marca la **declaración de autoría**.
4. Usa **Guardar** para el borrador o **Guardar y enviar a revisión**. Para enviar, el artículo necesita al menos 200 caracteres, una categoría y la declaración de autoría.

### Revisar y publicar
- **Solicitar correcciones:** el comentario le aparece al autor arriba del formulario.
- **Programar:** abre «SEO y publicación», define la fecha y hora (de Guatemala), guarda y pulsa «Programar publicación». El artículo se publica solo cuando llega esa hora.
- Cada cambio de estado queda en el **Historial** del artículo y en la auditoría.

### Autores
**Autores** administra los perfiles públicos (foto, biografía, redes). Al vincular un perfil con una cuenta de usuario, esa persona firma con él. Si un autor escribe sin perfil, el sistema se lo crea automáticamente con su nombre.

## Multimedia y documentos (Archivo)

### Subir
**Archivo → Multimedia y documentos**:
- **Fotografías y PDF:** selecciona hasta 30 archivos (8 MB cada uno). Los datos que completes (álbum, categoría, evento, fecha, crédito, departamento, personas, etiquetas) se aplican a todos los archivos de esa subida. El sistema comprueba el tipo real de cada archivo y rechaza los que no son imágenes o PDF.
- **Videos:** pega el enlace de YouTube, con título y tipo (documental, discurso, entrevista, evento, conferencia, institucional). El video se reproduce sin cookies de YouTube hasta que la persona pulsa «reproducir».
- Lo que subas queda **no público** salvo que marques «Publicar en el sitio de inmediato».

### Organizar
- **Álbumes de fotos:** crea el álbum (título, fecha, categoría, portada) y márcalo como público. Las fotos se asignan al subirlas o editándolas.
- **Editar un archivo:** en la cuadrícula, ábrelo para corregir el título, el pie de foto, el crédito, las personas o las etiquetas, cambiarlo de álbum, publicarlo u ocultarlo.
- **Eliminar:** borra el registro y también el archivo del servidor, salvo que otro registro use el mismo archivo.

### Dónde aparece en el sitio
| Contenido | Página |
|---|---|
| Álbumes y fotos sueltas | Archivo → Galería |
| Videos | Archivo → Videoteca |
| Todos los PDF, agrupados por tipo | Archivo → Documentos |
| Estatutos, reglamento, código de conducta, memoria | Conócenos → Transparencia (reemplazan a los marcadores) |
| Convocatorias, reglamento, resultados, actas | Elecciones → Documentación electoral |

El buscador de **Archivo** encuentra fotos, videos, documentos y acontecimientos por persona, evento, etiqueta, año, categoría y departamento.

Publica fotografías de personas solo con su consentimiento. El formulario de participación ya registra ese consentimiento.

## Contenido pendiente
**Contenido pendiente** reúne los materiales que faltan (logotipo, fotografías, biografías, documentos), agrupados por etapa. Marca cada uno como *Recibido* cuando llegue el material y como *Completado* cuando ya esté publicado.

## Auditoría
**Auditoría** registra los ingresos, las consultas de postulaciones y los cambios de estado.

## Niveles de verificación (sitio público)
- **Fuente oficial:** dato comprobado en una fuente pública oficial; siempre enlaza a ella.
- **Registro institucional:** dato proporcionado por Congreso Joven.
- **Por confirmar:** dato pendiente; no se presenta como hecho.
