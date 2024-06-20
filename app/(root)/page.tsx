import ThreadCard from "@/components/cards/ThreadCard";
import Pagination from "@/components/shared/Pagination";

import { fetchPosts } from "@/lib/actions/thread.actions";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  try {
    // Fetch the posts and current user concurrently
    const [result, user] = await Promise.all([fetchPosts(searchParams.page? +searchParams.page : 1, 30), currentUser()]);
    // Render the component
    return (
      <>
        <h1 className="head-text text-left">Home</h1>
        <section className="mt-9 flex flex-col gap-10">
          {result.posts.length === 0 ? (
            <p className="no-result">No threads found</p>
          ) : (
            result.posts.map((post) => {
              if (post.parentId === null) {
                return (
                  <ThreadCard
                    key={post._id}
                    id={post._id}
                    currentUserId={user?.id || ""}
                    parentId={post.parentId || null}
                    content={post.text}
                    author={post.author}
                    community={post.community}
                    createdAt={post.createdAt}
                    comments={post.children}
                    likes={post.likes}
                    isLoggedIn={user ? true : false}
                  />
                )
              }
            })
          )}
        </section>
        <Pagination
          path='/'
          pageNumber={searchParams?.page ? +searchParams.page : 1}
          isNext={result.isNext}
        />
      </>
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return (
      <>
        <h1 className="head-text text-left">Home</h1>
        <p className="error-message">Failed to load threads. Please try again later.</p>
      </>
    );
  }
}
