import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return <div style={{ padding: 16 }}>boot smoke test</div>;
}
