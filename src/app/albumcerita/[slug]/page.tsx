type Params = Promise<{ slug: string }>;

export default async function AlbumCeritaSlugPage({ params }: { params: Params }) {
  const { slug } = await params;
  return (
    <div className="p-8">
      <h1>Album Cerita: {slug}</h1>
    </div>
  );
}
