export default function PlatformFavicon({ platformId, name }: { platformId: string; name: string }) {
  return (
    <img
      src={`/favicons/${platformId}.png`}
      alt={name}
      width={20}
      height={20}
      className="w-5 h-5 rounded-sm"
    />
  )
}
