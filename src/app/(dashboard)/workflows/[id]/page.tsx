// This is a server component that passes params to the client component
import WorkflowEditor from './WorkflowEditor';

export default function WorkflowPage({ params }: { params: { id: string } }) {
  return <WorkflowEditor id={params.id} />;
}
