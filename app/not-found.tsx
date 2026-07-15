import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex size-full flex-col items-center justify-center">
      <h2 className="text-xl font-semibold">404</h2>
      <p>No se encontró el recurso solicitado</p>
      <Link href="/" className="underline">
        Volver al inicio
      </Link>
    </div>
  );
}
