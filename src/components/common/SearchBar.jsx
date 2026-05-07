export default function SearchBar({ value, onChange, placeholder = 'Search…', children }) {
  return (
    <div className="sBar">
      <div className="siWrap">
        <span className="siIc">🔍</span>
        <input
          className="si"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {children}
    </div>
  )
}
