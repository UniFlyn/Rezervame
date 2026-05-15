import BusinessClient from "./BusinessClient";

export async function generateStaticParams() {
  return [{ id: "default" }];
}

export default function BusinessPage({ params }: { params: { id: string } }) {
  return <BusinessClient params={params} />;
}
