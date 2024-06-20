import AccountProfile from '@/components/forms/AccountProfile';
import { fetchUser } from '@/lib/actions/user.actions';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { User } from '@clerk/nextjs/server'; 

interface UserInfo {
    id: string;
    username: string;
    name: string;
    bio: string;
    image: string;
    onboarded: boolean;
}

async function Page() {
    let user: User | null = null;
    let userInfo: UserInfo | null = null;

    try {
        user = await currentUser();
        if (user) {
            userInfo = await fetchUser(user.id);
        }
    } catch (error: any) {
        throw new Error(`Error in fetching user :${error.message}`);
    }
    
    if (!userInfo?.onboarded) redirect('/onboarding');

    const userData = {
        id: user?.id || "",
        objectId: userInfo ? userInfo?.id : "",
        username: userInfo ? userInfo?.username : user?.username || "",
        name: userInfo ? userInfo?.name : user?.firstName || "",
        bio: userInfo ? userInfo?.bio : "",
        image: userInfo ? userInfo?.image : user?.imageUrl || "",
    };

    return (
        <main className="mx-auto flex max-w-3xl flex-col justify-start px-10 py-20">
            <h1 className="head-text">Edit Profile</h1>
            <section className="mt-9 bg-dark-2p-10">
                <AccountProfile user={userData} btnTitle='Continue'/>
            </section>
        </main>
    )
}

export default Page;