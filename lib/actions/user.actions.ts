'use server'

import { revalidatePath } from "next/cache"
import { FilterQuery, SortOrder } from "mongoose"

import { connectToDB } from "../mongoose"

import User from "../models/user.model"
import Thread from "../models/thread.model"

interface Params {
    userId: string,
    username: string,
    name: string,
    bio: string,
    image: string,
    path: string,
}

export async function updateUser({
    userId,
    username,
    name,
    bio,
    image,
    path,
}: Params): Promise<void> {
    try {
        await connectToDB();
        await User.findOneAndUpdate(
            { id: userId },
            {
                username: username.toLowerCase(),
                name,
                bio,
                image,
                onboarded: true,
            },
            { upsert: true }
        );
    
        if(path === '/profile/edit') {
            revalidatePath(path);
        }
    } catch (error: any) {
        console.log(`Failed to create/update user: ${error.message}`);
        throw new Error(`Failed to create/update user: ${error.message}`);
    }
}

export async function fetchUser(userId: string) {
    try {
        await connectToDB();

        return await User
            .findOne({ id: userId });
            // .populate({
            //     path: 'communities',
            //     model: 'Communities',
            // })
    } catch (error: any) {
        console.log(`Failed to fetch user: ${error.message}`);
        throw new Error(`Failed to fetch user: ${error.message}`);
    }
}

export async function fetchUserPosts(userId: string) {
    try {
        await connectToDB();
        const threads = await User.findOne({ id: userId})
            .populate({
                path: 'threads',
                model: Thread,
                populate: [
                    {
                        path: 'children',
                        model: Thread,
                        populate: {
                            path: 'author',
                            model: User,
                            select: 'name image id username'
                        }
                    },
                    {
                        path: 'likes',
                        model: User,
                        select: 'id',
                    },
                ]
            })
        return threads;
    } catch (error: any) {
        console.log(`Failed to fetch posts: ${error.message}`);
        throw new Error(`Failed to fetch posts: ${error.message}`);
    }
}

export async function fetchUserReplies(userId: string) {
    try {
        await connectToDB();
        const threads = await Thread.find({ author: userId, parentId: { $ne: null} })
            .populate({
                path: 'author',
                model: User,
                select: 'name image id username'
            })
            .populate({
                path: 'likes',
                model: User,
                select: 'id',
            })
            .populate({
                path: 'children',
                populate: {
                    path: 'author',
                    model: User,
                    select: 'name image id username',
                }
            })
        return threads;
    } catch (error: any) {
        console.log(`Failed to fetch posts: ${error.message}`);
        throw new Error(`Failed to fetch posts: ${error.message}`);
    }
}

export async function fetchUsers({
    userId,
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = 'desc'
}: {
    userId: string;
    searchString?: string;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: SortOrder;
}) {
    try {
        await connectToDB();

        const skipAmount = (pageNumber - 1) * pageSize;

        const regex = new RegExp(searchString, 'i');

        const query: FilterQuery<typeof User> = {
            id: { $ne: userId }
        };

        if(searchString.trim() !== '') {
            query.$or = [
                {username: { $regex: regex } },
                { name: { $regex: regex } },
            ];
        }

        const sortOptions = { createdAt: sortBy }

        const usersQuery = User.find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize);

        const totalUsersCount = await User.countDocuments(query);
        const users = await usersQuery.exec();
        const isNext = totalUsersCount > skipAmount + users.length;
        
        return { users, isNext };
    } catch (error: any) {
        console.log(`Failed to fetch users ${error.message}`);
        throw new Error(`Failed to fetch users ${error.message}`);
    }
}

export async function getActivity(userId: string) {
    try {
        await connectToDB();

        const userThreads = await Thread.find({ author: userId });

        const childThreadIds = userThreads.reduce((acc, userThread) => {
            return acc.concat(userThread.children)
        }, []);

        const likesThreadIds = userThreads.reduce((acc, userThread) => {
            return acc.concat(userThread.likes.map((like: any) => ({ threadId: userThread._id, userId: like._id })));
        }, []);

        const uniqueUserIds = Array.from(new Set(likesThreadIds.map((like: any) => like.userId.toString())));

        const userObjects = await User.find({
            _id: { $in: uniqueUserIds, $ne: userId },
        }).select('name image _id');

        const likes = likesThreadIds.map((like: any) => {
            const user = userObjects.find(user => user._id.toString() === like.userId.toString());
            return user ? { ...user.toObject(), threadId: like.threadId.toString() } : null;
        }).filter((like: null) => like !== null);


        const replies = await Thread.find({
            _id: { $in: childThreadIds },
            author: { $ne: userId },
        }).populate({
            path: 'author',
            model: User,
            select: 'name image _id',
        });

        return { replies, likes };
    } catch (error: any) {
        console.log(`Failed to fetch activity: ${error.message}`);
        throw new Error(`Failed to fetch activity: ${error.message}`);
    }
}