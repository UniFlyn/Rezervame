import ReservationClient from "./ReservationClient";

export async function generateStaticParams() {
  return [{ id: "default" }];
}

export default function ReservationPage() {
  return <ReservationClient />;
}
