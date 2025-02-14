import Link from "next/link";

export default function ProductCard({
  image,
  title,
  description,
  buttons = [],
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105 w-full max-w-sm">
      <img src={image} alt={title} className="w-full h-48 object-contain p-4" />
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 text-center">{title}</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">{description}</p>
        {buttons.map(({ text, href, onClick, style }, index) => (
          <div key={index} className="mb-4">
            {onClick ? (
              <button
                onClick={onClick}
                className={`block text-center py-2 px-4 rounded-lg ${style} w-full`}
              >
                {text}
              </button>
            ) : (
              <Link
                href={href}
                className={`block text-center py-2 px-4 rounded-lg ${style} w-full`}
              >
                {text}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
