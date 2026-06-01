import VenueClient from "./VenueClient";

export async function generateStaticParams() {
  return [{ id: "default" }];
}

export default function VenuePage({ params }: { params: { id: string } }) {
  return <VenueClient businessId={params.id} />;
}
