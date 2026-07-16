export function SectionHeading({
  eyebrow,
  title,
  intro,
  center = true,
  id,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  center?: boolean;
  id?: string;
}) {
  return (
    <div className={`mb-10 max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-tan-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 id={id} className="text-3xl font-bold sm:text-4xl">{title}</h2>
      {intro ? <p className="mt-4 text-lg leading-relaxed text-navy-600">{intro}</p> : null}
    </div>
  );
}
