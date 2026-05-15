import VenueClient from "./VenueClient";

export async function generateStaticParams() {
  return [
    { id: "default" },
    { id: "cmp6dhgwm0006gne0151t5tpv" }
  ];
}

export default function VenuePage({ params }: { params: { id: string } }) {
  return <VenueClient businessId={params.id} />;
}
