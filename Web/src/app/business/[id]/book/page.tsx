import BookClient from "./BookClient";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function BookPage({ params }: { params: { id: string } }) {
  return <BookClient params={params} />;
}
