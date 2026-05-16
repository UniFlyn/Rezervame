import VenueClient from "./VenueClient";

export default function VenuePage({ params }: { params: { id: string } }) {
  return <VenueClient businessId={params.id} />;
}
