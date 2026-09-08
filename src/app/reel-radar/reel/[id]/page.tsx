import ReelDetailView from "@/components/reelradar/ReelDetailView";

export default async function ReelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-8 max-w-5xl">
      <ReelDetailView id={id} />
    </div>
  );
}
