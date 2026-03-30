"use server"
import AgreementAccepted from './agreement';
export default async function Home() {
  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-gray-50">

      <AgreementAccepted />

    </div>
  );
}
