import { fetchUserReplies } from "@/lib/actions/user.actions"
import { redirect } from "next/navigation"
import ThreadCard from "../cards/ThreadCard"

interface Props {
    currentUserId: string;
    accountId: string;
    accountType: string;
    isLoggedIn?: boolean;
}

const RepliesTab = async({
    currentUserId,
    accountId,
    accountType,
    isLoggedIn,
}: Props) => {
    
    let result = await fetchUserReplies(accountId);

    if (!result) redirect('/');
    return(
        <section className="mt-9 flex flex-col gap-10">
            {result.map((thread: any) => (<>
                <ThreadCard
                    key={thread._id}
                    id={thread._id}
                    currentUserId={currentUserId || ""}
                    parentId={thread.parentId}
                    content={thread.text}
                    author={
                        { name: thread.author.name, image: thread.author.image, id: thread.author.id, username: thread.author.username }
                    }
                    community={thread.community}
                    createdAt={thread.createdAt}
                    comments={thread.children}
                    likes={thread.likes}
                    isLoggedIn={isLoggedIn}
                />
            </>))}
        </section>
    );
}

export default RepliesTab;