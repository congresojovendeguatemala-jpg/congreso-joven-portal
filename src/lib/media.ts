/** Vocabularios del archivo multimedia (compartidos por el panel y el sitio). */
export const MEDIA_CATEGORIES: Record<string, string> = {
  eventos: "Eventos",
  autoridades: "Autoridades",
  generaciones: "Generaciones",
  territorial: "Actividades territoriales",
  congreso: "Congreso de la República",
  internacional: "Relaciones internacionales",
  institucional: "Material institucional",
};

export const DOC_TYPES: Record<string, string> = {
  estatutos: "Estatutos",
  reglamento: "Reglamentos",
  codigo: "Código de conducta",
  acta: "Actas",
  informe: "Informes",
  convocatoria: "Convocatorias",
  memoria: "Memorias institucionales",
  reconocimiento: "Reconocimientos",
  resultados: "Resultados electorales",
  otro: "Otros documentos",
};

export const VIDEO_TYPES: Record<string, string> = {
  documental: "Documentales",
  discurso: "Discursos",
  entrevista: "Entrevistas",
  evento: "Eventos",
  conferencia: "Conferencias",
  institucional: "Material institucional",
};

export const fmtBytes = (n: number | null | undefined) =>
  !n ? "" : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
