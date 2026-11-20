import { PageHeader, Card } from "../layout/PageHeader";

export default function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" />
      <Card>
        <p className="text-[13px] text-qp-mut">This page does not exist. Use the sidebar to continue.</p>
      </Card>
    </>
  );
}
