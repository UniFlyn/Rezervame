import VenueClient from "./VenueClient";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function VenuePage() {
  return <VenueClient />;
}
