import Link from "next/link";

export type OrgNode = { id: number; slug: string; name: string; kind: string; parentId: number | null; confirmed: boolean; description: string | null };
export type Holder = { organId: number | null; name: string; slug: string };

/** Colores por rama, tomados del organigrama oficial. */
const BRANCH: Record<string, { label: string; dot: string; bar: string; chip: string }> = {
  "secretaria-general": { label: "Secretaría General", dot: "bg-emerald-500", bar: "border-emerald-500", chip: "bg-emerald-50 text-emerald-800" },
  "tribunal-de-honor": { label: "Tribunal de Honor", dot: "bg-rose-500", bar: "border-rose-500", chip: "bg-rose-50 text-rose-800" },
  "voceria-oficial": { label: "Vocería Oficial", dot: "bg-violet-500", bar: "border-violet-500", chip: "bg-violet-50 text-violet-800" },
  bancadas: { label: "Bancadas", dot: "bg-orange-400", bar: "border-orange-400", chip: "bg-orange-50 text-orange-800" },
};
const BLUE = { label: "", dot: "bg-blue-600", bar: "border-blue-600", chip: "bg-blue-100 text-navy-800" };
export const branchStyle = (slug: string) => BRANCH[slug] ?? BLUE;

export function OrgChart({ organs, holders }: { organs: OrgNode[]; holders: Holder[] }) {
  const kids = (id: number) => organs.filter((o) => o.parentId === id);
  const root = organs.find((o) => !o.parentId || !organs.some((p) => p.id === o.parentId));
  if (!root) return null;
  const branches = kids(root.id);
  const held = (id: number) => holders.filter((h) => h.organId === id);
  // Orden de lectura: Presidencia → vicepresidencias/secretarías (azul) → resto de ramas
  const blue = branches.filter((b) => !BRANCH[b.slug]);
  const colored = branches.filter((b) => BRANCH[b.slug]);

  return (
    <div>
      {/* Nodo raíz */}
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-navy-900 px-8 py-3 text-center text-white shadow-[0_10px_30px_-12px_rgba(11,26,61,0.6)]">
          <p className="font-serif text-xl">{root.name}</p>
          {held(root.id).map((h) => (
            <Link key={h.slug} href={`/estructura/${h.slug}`} className="text-xs text-blue-300 hover:text-white">
              {h.name}
            </Link>
          ))}
        </div>
        <div className="h-8 w-px bg-stone-300" aria-hidden />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {blue.length > 0 && (
          <BranchCard title="Vicepresidencias y Secretarías" style={BLUE}>
            {blue.map((b) => (
              <Subtree key={b.id} node={b} kids={kids} held={held} depth={0} />
            ))}
          </BranchCard>
        )}
        {colored.map((b) => (
          <BranchCard key={b.id} title={b.name} style={branchStyle(b.slug)} holders={held(b.id)}>
            {kids(b.id).map((k) => (
              <Subtree key={k.id} node={k} kids={kids} held={held} depth={0} />
            ))}
          </BranchCard>
        ))}
      </div>
    </div>
  );
}

function BranchCard({ title, style, holders = [], children }: { title: string; style: typeof BLUE; holders?: Holder[]; children: React.ReactNode }) {
  return (
    <section className={`border border-stone-200 border-t-4 ${style.bar} bg-white p-6`}>
      <h3 className="flex items-center gap-2.5 font-serif text-xl">
        <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden />
        {title}
      </h3>
      {holders.length > 0 && <HolderList holders={holders} />}
      <div className="mt-4 space-y-1">{children}</div>
    </section>
  );
}

function HolderList({ holders }: { holders: Holder[] }) {
  return (
    <p className="mt-1 text-sm">
      {holders.map((h, i) => (
        <span key={h.slug}>
          {i > 0 && " · "}
          <Link href={`/estructura/${h.slug}`} className="text-blue-600 hover:underline">
            {h.name}
          </Link>
        </span>
      ))}
    </p>
  );
}

function Subtree({ node, kids, held, depth }: { node: OrgNode; kids: (id: number) => OrgNode[]; held: (id: number) => Holder[]; depth: number }) {
  const ch = kids(node.id);
  const isGroup = node.description === "Agrupación del organigrama";
  const h = held(node.id);
  return (
    <div className={depth > 0 ? "ml-3 border-l border-stone-200 pl-3" : ""}>
      <div className="py-1.5">
        <p className={isGroup ? "eyebrow mt-2 text-[0.62rem] text-graphite" : "text-[0.95rem] text-ink"}>
          {node.name}
          {!node.confirmed && <span className="ml-2 text-[0.6rem] uppercase tracking-wider text-amber-700">por confirmar</span>}
        </p>
        {h.length > 0 ? <HolderList holders={h} /> : !isGroup && ch.length === 0 && <p className="text-xs text-stone-400">Titular por publicar</p>}
      </div>
      {ch.map((c) => (
        <Subtree key={c.id} node={c} kids={kids} held={held} depth={isGroup ? depth : depth + 1} />
      ))}
    </div>
  );
}
