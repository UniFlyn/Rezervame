import BusinessClient from "./BusinessClient";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function BusinessPage({ params }: { params: { id: string } }) {
  return <BusinessClient params={params} />;
}
