export default function Tag({ variant = 'tN', children, style }) {
  return <span className={`tag ${variant}`} style={style}>{children}</span>
}
