import { getCurrentUserAction } from "@/app/actions";
import { Header } from "@/app/components/Header";
import { UserSearchContent } from "./UserSearchContent";

export const dynamic = "force-dynamic";

export default async function UserSearchPage() {
  let currentUser: Awaited<ReturnType<typeof getCurrentUserAction>> | null =
    null;
  try {
    currentUser = await getCurrentUserAction();
  } catch {
    currentUser = null;
  }

  return (
    <>
      <Header user={currentUser} />
      <div className="container mx-auto p-4 font-sans">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-white px-6 py-12">
          <UserSearchContent />
        </main>
      </div>
    </>
  );
}
