
interface ClientSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ClientSearch({
  value,
  onChange,
}: ClientSearchProps) {
  return (
    <div className="relative w-full">
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Pesquisar cliente pelo nome..."
        aria-label="Pesquisar cliente pelo nome"
        className="w-full rounded-lg border border-[#2A2A2A] bg-[#141414] px-4 py-3 text-sm text-[#D2D3D5] outline-none transition placeholder:text-[#777] focus:border-[#1CF637]"
      />
    </div>
  );
}
