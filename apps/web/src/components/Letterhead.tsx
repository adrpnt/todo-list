const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

interface LetterheadProps {
  eyebrow: string;
  title: string;
  showDate?: boolean;
}

export function Letterhead({ eyebrow, title, showDate = true }: LetterheadProps) {
  return (
    <header className="letterhead">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {showDate && <div className="date">{dateFormatter.format(new Date())}</div>}
    </header>
  );
}
