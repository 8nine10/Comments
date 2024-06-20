import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { fetchUser, getActivity } from "@/lib/actions/user.actions"
import Link from "next/link"
import Image from "next/image"



const Page = async () => {
  const user = await currentUser()
  
  if (!user) return null
  
  const userInfo = await fetchUser(user.id)
  
  if (!userInfo?.onboarded) redirect('/onboarding')

  const {replies, likes} = await getActivity(userInfo._id)
  return (
    <section>
      <h1 className="head-text mb-10">Activity</h1>

      <section className="mt-10 flex flex-col gap-5">
        {replies.length + likes.length > 0 ? (
          <>
            {replies?.map((reply) => (
              <Link key={reply._id} href={`/thread/${reply.parentId}`}>
                <article className="activity-card">
                  <Image
                    src={reply.author.image}
                    alt='Profle picture'
                    width={20}
                    height={20}
                    className="rounded-full object-contain"
                  />
                  <p className="!text-small-regular text-light-1">
                    <span className="mr-1 text-primary-500">
                      {reply.author.name}
                    </span>{" "}
                    replied to your thread.
                  </p>
                </article>
              </Link>
            ))}
            {likes?.map((like:any) => (
              <Link key={like._id} href={`/thread/${like.threadId}`}>
                <article className="activity-card">
                  <Image
                    src={like.image}
                    alt='Profle picture'
                    width={20}
                    height={20}
                    className="rounded-full object-contain"
                  />
                  <p className="!text-small-regular text-light-1">
                    <span className="mr-1 text-primary-500">
                      {like.name}
                    </span>{" "}
                    liked your thread.
                  </p>
                </article>
              </Link>
            ))}
          </>
        ): <p className="!text-small-regular text-light-1">No activity</p>}
      </section>
    </section>
  )
}
  
  export default Page