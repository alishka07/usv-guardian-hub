// Taxonomy of pollution sources per the AquaWatch landing — five types the
// AI/heuristic classifier maps a measurement signature to.

export type PollutionSource =
  | "domestic"
  | "agricultural"
  | "industrial"
  | "oilgas"
  | "natural";

export const POLLUTION_SOURCES: Record<
  PollutionSource,
  { label: string; description: string }
> = {
  domestic: {
    label: "Бытовые стоки",
    description: "Канализация, моющие средства, органика, микропластик",
  },
  agricultural: {
    label: "Сельскохозяйственные",
    description: "Удобрения (N, P), пестициды, навоз, заиление",
  },
  industrial: {
    label: "Промышленные",
    description: "Тяжёлые металлы, химикаты, термальное загрязнение",
  },
  oilgas: {
    label: "Нефтегазовые",
    description: "Углеводороды, плёнка, BTEX",
  },
  natural: {
    label: "Природные",
    description: "Цветение, сезонные паводки, эрозия",
  },
};
